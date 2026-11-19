import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { API, admin, borrarCuenta, crearCuenta, crearPropiedad, fotosDe, iniciarSesion, limpiarPropiedades } from "./supabase";

// Spec 4 (fotos-propiedades): subida comprimida, orden, portada, borrado y acceso solo del admin.

let cuentas: { id: string; email: string }[] = [];
let pagina: Page;

test.beforeAll(async ({ browser }) => {
  cuentas = [await crearCuenta("admin", true), await crearCuenta("noadmin", false)];
  pagina = await iniciarSesion(browser, cuentas[0].email);
});

test.afterAll(async () => {
  await limpiarPropiedades();
  for (const c of cuentas) await borrarCuenta(c.id);
});

// Imagen generada en el navegador: mitad izquierda roja y derecha azul, para ver la orientación.
async function imagen(page: Page, ancho: number, alto: number, tipo = "image/jpeg"): Promise<Buffer> {
  const dataUrl = await page.evaluate(
    ([w, h, t]) => {
      const c = document.createElement("canvas");
      c.width = w as number;
      c.height = h as number;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#d00";
      ctx.fillRect(0, 0, (w as number) / 2, h as number);
      ctx.fillStyle = "#00d";
      ctx.fillRect((w as number) / 2, 0, (w as number) / 2, h as number);
      return c.toDataURL(t as string, 0.9);
    },
    [ancho, alto, tipo],
  );
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

// Inserta un segmento EXIF con orientación 6 (girar 90° a la derecha), como una foto vertical de celular.
function conOrientacion6(jpeg: Buffer): Buffer {
  const exif = Buffer.from([
    0xff, 0xe1, 0x00, 0x22, // APP1, largo 34
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // "Exif\0\0"
    0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08, // TIFF big-endian, IFD en 8
    0x00, 0x01, // 1 entrada
    0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, 0x06, 0x00, 0x00, // Orientation = 6
    0x00, 0x00, 0x00, 0x00, // sin más IFD
  ]);
  return Buffer.concat([jpeg.subarray(0, 2), exif, jpeg.subarray(2)]);
}

async function dimensiones(page: Page, path: string) {
  const url = `${API}/storage/v1/object/public/propiedades/${path}`;
  const res = await fetch(url);
  const tipo = res.headers.get("content-type");
  const dims = await page.evaluate(
    (u) =>
      new Promise<[number, number]>((ok, mal) => {
        const img = new Image();
        img.onload = () => ok([img.naturalWidth, img.naturalHeight]);
        img.onerror = mal;
        img.src = u;
      }),
    url,
  );
  return { tipo, ancho: dims[0], alto: dims[1] };
}

const galeria = (page: Page) => page.locator("section[aria-labelledby=titulo-fotos] ol > li");

async function subir(page: Page, archivos: { name: string; mimeType: string; buffer: Buffer }[]) {
  const input = page.locator('input[name="fotos"]');
  await expect(input).toBeEnabled();
  await input.setInputFiles(archivos);
  await expect(page.getByRole("list", { name: "Fotos en proceso" }).locator("li")).toHaveCount(archivos.length);
  await expect(page.getByRole("list", { name: "Fotos en proceso" })).not.toContainText(/en cola|comprimiendo|subiendo/, { timeout: 30_000 });
}

test("sube varias fotos en orden, comprimidas a 1600 px y en JPEG", async () => {
  const id = await crearPropiedad("Casa fotos");
  await pagina.goto(`/admin/propiedades/${id}`);
  await expect(pagina.getByText("Todavía no hay fotos")).toBeVisible();

  const grande = await imagen(pagina, 4000, 3000);
  const png = await imagen(pagina, 800, 600, "image/png");
  const vertical = conOrientacion6(await imagen(pagina, 400, 300));
  await subir(pagina, [
    { name: "grande.jpg", mimeType: "image/jpeg", buffer: grande },
    { name: "plano.png", mimeType: "image/png", buffer: png },
    { name: "vertical.jpg", mimeType: "image/jpeg", buffer: vertical },
  ]);

  await expect(galeria(pagina)).toHaveCount(3);
  await expect(galeria(pagina).first()).toContainText("Portada");
  const fotos = await fotosDe(id);
  expect(fotos.map((f) => f.orden)).toEqual([0, 1, 2]);
  expect(await dimensiones(pagina, fotos[0].path)).toEqual({ tipo: "image/jpeg", ancho: 1600, alto: 1200 });
  expect(await dimensiones(pagina, fotos[1].path)).toMatchObject({ tipo: "image/jpeg", ancho: 800, alto: 600 });
  // La foto vertical (400×300 con orientación 6) queda guardada en vertical.
  expect(await dimensiones(pagina, fotos[2].path)).toMatchObject({ ancho: 300, alto: 400 });
  // El orden de la galería en pantalla es el de la base.
  expect(await galeria(pagina).evaluateAll((li) => li.map((x) => x.getAttribute("data-path")))).toEqual(fotos.map((f) => f.path));

  // Agregar a una galería existente: va al final.
  await subir(pagina, [{ name: "otra.jpg", mimeType: "image/jpeg", buffer: await imagen(pagina, 300, 200) }]);
  const despues = await fotosDe(id);
  expect(despues.length).toBe(4);
  expect(despues.slice(0, 3).map((f) => f.path)).toEqual(fotos.map((f) => f.path));
});

test("rechaza un archivo que no es imagen y sube los demás", async () => {
  const id = await crearPropiedad("Casa pdf");
  await pagina.goto(`/admin/propiedades/${id}`);
  await subir(pagina, [
    { name: "contrato.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n") },
    { name: "foto.jpg", mimeType: "image/jpeg", buffer: await imagen(pagina, 300, 200) },
  ]);
  await expect(pagina.getByRole("list", { name: "Fotos en proceso" })).toContainText("contrato.pdf: No es una imagen");
  await expect(galeria(pagina)).toHaveCount(1);
  expect((await fotosDe(id)).length).toBe(1);
});

test("mover, elegir portada y borrar, con el orden guardado al recargar", async () => {
  const id = await crearPropiedad("Casa orden");
  await pagina.goto(`/admin/propiedades/${id}`);
  const archivos = await Promise.all(
    ["a", "b", "c", "d"].map(async (n) => ({ name: `${n}.jpg`, mimeType: "image/jpeg", buffer: await imagen(pagina, 300, 200) })),
  );
  await subir(pagina, archivos);
  const [a, b, c, d] = (await fotosDe(id)).map((f) => f.path);
  const orden = async () => (await fotosDe(id)).map((f) => f.path);

  // Mover la tercera una posición antes.
  await pagina.getByRole("button", { name: "Mover la foto 3 antes" }).click();
  await expect.poll(orden).toEqual([a, c, b, d]);

  // La cuarta como portada: pasa a primera y las demás conservan su orden.
  await pagina.getByRole("button", { name: "Usar la foto 4 como portada" }).click();
  await expect.poll(orden).toEqual([d, a, c, b]);

  await pagina.reload();
  expect(await galeria(pagina).evaluateAll((li) => li.map((x) => x.getAttribute("data-path")))).toEqual([d, a, c, b]);
  await expect(galeria(pagina).first()).toContainText("Portada");

  // Borrar cancelado: sigue.
  pagina.once("dialog", (dlg) => dlg.dismiss());
  await pagina.getByRole("button", { name: "Borrar la foto 1" }).click();
  await expect(galeria(pagina)).toHaveCount(4);

  // Borrar la portada: desaparece su archivo y la segunda pasa a ser la portada.
  pagina.once("dialog", (dlg) => dlg.accept());
  await pagina.getByRole("button", { name: "Borrar la foto 1" }).click();
  await expect(galeria(pagina)).toHaveCount(3);
  expect(await fotosDe(id)).toMatchObject([
    { path: a, orden: 0 },
    { path: c, orden: 1 },
    { path: b, orden: 2 },
  ]);
  expect((await fetch(`${API}/storage/v1/object/public/propiedades/${d}`)).status).toBeGreaterThanOrEqual(400);

  // Miniatura de portada en el listado.
  await pagina.goto("/admin");
  await expect(pagina.locator(`img[src$="${a}"]`)).toBeVisible();
});

test("no supera el máximo de 30 fotos", async () => {
  const id = await crearPropiedad("Casa llena");
  // 29 fotos ya registradas (sin archivo: solo cuentan para el límite).
  await admin("POST", "/rest/v1/propiedad_fotos", Array.from({ length: 29 }, (_, i) => ({ propiedad_id: id, path: `${id}/relleno-${i}.jpg`, orden: i })));
  await pagina.goto(`/admin/propiedades/${id}`);
  await expect(pagina.getByText("(29 de 30)")).toBeVisible();
  await subir(pagina, [
    { name: "ultima.jpg", mimeType: "image/jpeg", buffer: await imagen(pagina, 300, 200) },
    { name: "sobra.jpg", mimeType: "image/jpeg", buffer: await imagen(pagina, 300, 200) },
  ]);
  await expect(pagina.getByRole("list", { name: "Fotos en proceso" })).toContainText("sobra.jpg: Se alcanzó el máximo de 30 fotos.");
  expect((await fotosDe(id)).length).toBe(30);
  await expect(pagina.locator('input[name="fotos"]')).toBeDisabled();
});

test("una cuenta no admin no puede ordenar ni borrar fotos aunque llame a las acciones", async ({ browser }) => {
  const id = await crearPropiedad("Casa intrusa");
  await pagina.goto(`/admin/propiedades/${id}`);
  await subir(
    pagina,
    await Promise.all(["x", "y"].map(async (n) => ({ name: `${n}.jpg`, mimeType: "image/jpeg", buffer: await imagen(pagina, 300, 200) }))),
  );
  const antes = await fotosDe(id);

  // Captura las peticiones reales de las acciones que hace el admin, sin dejarlas pasar.
  const capturadas: { headers: Record<string, string>; body: string }[] = [];
  await pagina.route(`**/admin/propiedades/${id}`, async (route) => {
    const req = route.request();
    if (req.method() === "POST" && req.headers()["next-action"]) {
      capturadas.push({ headers: req.headers(), body: req.postData() ?? "" });
      await route.abort();
    } else await route.continue();
  });
  await pagina.getByRole("button", { name: "Usar la foto 2 como portada" }).click();
  // Con la petición cortada (como sin señal), la galería vuelve atrás, avisa y sigue usable.
  await expect(pagina.getByText("No se pudo guardar el cambio. Revisa la conexión")).toBeVisible();
  expect(await galeria(pagina).evaluateAll((li) => li.map((x) => x.getAttribute("data-path")))).toEqual(antes.map((f) => f.path));
  pagina.once("dialog", (dlg) => dlg.accept());
  await pagina.getByRole("button", { name: "Borrar la foto 1" }).click();
  await expect.poll(() => capturadas.length).toBe(2);
  await pagina.unroute(`**/admin/propiedades/${id}`);

  // Las repite la cuenta no admin con su propia sesión. Dos barreras, verificadas por separado:
  // exigirAdmin() en la acción la manda a /admin/sin-acceso, y RLS impide el cambio igual.
  const intrusa = await iniciarSesion(browser, cuentas[1].email);
  for (const { headers, body } of capturadas) {
    const sinCookie = Object.fromEntries(Object.entries(headers).filter(([k]) => k !== "cookie"));
    const res = await intrusa.context().request.post(`/admin/propiedades/${id}`, { headers: sinCookie, data: body, maxRedirects: 0 });
    expect(res.headers()["x-action-redirect"] ?? "", `acción ${headers["next-action"]}`).toContain("/admin/sin-acceso");
  }
  expect(await fotosDe(id)).toEqual(antes);
  for (const f of antes) expect((await fetch(`${API}/storage/v1/object/public/propiedades/${f.path}`)).status).toBe(200);
  await intrusa.context().close();
});
