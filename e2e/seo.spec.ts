import { expect, test, type Page } from "@playwright/test";
import { admin, borrarCuenta, crearCuenta, crearPropiedad, iniciarSesion, limpiarPropiedades, run, subirFoto } from "./supabase";

// Spec 7 (seo-y-compartir). La app se construye con NEXT_PUBLIC_SITE_URL=http://localhost:3000 (CI),
// así las URL absolutas de los metadatos apuntan a la app de prueba y se pueden descargar.

let cuenta: { id: string; email: string };
let panel: Page;
const t = (n: string) => `${n} ${run}`;
const slug = (n: string) => `${n.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${run}`;
const ids: Record<string, string> = {};

async function propiedad(nombre: string, datos: Record<string, unknown>) {
  ids[nombre] = await crearPropiedad(nombre);
  await admin("PATCH", `/rest/v1/propiedades?id=eq.${ids[nombre]}`, datos);
}

async function invalidar() {
  await panel.goto("/admin");
  const estrella = panel.locator("tr", { hasText: t("Ancla") }).getByRole("button", { name: /Destacar|Quitar de destacadas/ });
  for (let i = 0; i < 2; i++) {
    const antes = await estrella.getAttribute("aria-pressed");
    await estrella.click();
    await expect(estrella).not.toHaveAttribute("aria-pressed", antes!);
  }
}

const meta = (page: Page, nombre: string) =>
  page.locator(`meta[property="${nombre}"], meta[name="${nombre}"]`).first().getAttribute("content");
const jsonLd = async (page: Page) =>
  Promise.all((await page.locator('script[type="application/ld+json"]').allTextContents()).map((x) => JSON.parse(x)));

test.beforeAll(async ({ browser }) => {
  test.setTimeout(90_000);
  cuenta = await crearCuenta("seo", true);
  panel = await iniciarSesion(browser, cuenta.email);
  await crearPropiedad("Ancla");
  await propiedad("Con foto", {
    estado: "publicada", precio: 5200, moneda: "UF", sector: "Cavancha", direccion: "Calle Secreta 123",
    mostrar_direccion: false, dormitorios: 3, banos: 2,
  });
  await subirFoto(panel, ids["Con foto"], 0);
  await propiedad("Sin foto", { estado: "publicada", operacion: "arriendo", tipo: "departamento", precio: 650000, moneda: "CLP" });
  await propiedad("Borrador", { estado: "borrador" });
  await invalidar();
});

test.afterAll(async () => {
  await limpiarPropiedades();
  await borrarCuenta(cuenta.id);
});

test("vista previa de una ficha con foto: absoluta, liviana y con descripción", async ({ page, request }) => {
  await page.goto(`/propiedades/${slug("Con foto")}`);
  const origen = new URL(page.url()).origin;
  expect(await meta(page, "og:title")).toBe(t("Con foto"));
  expect(await meta(page, "og:description")).toBe("Venta de casa en Cavancha, Iquique. UF 5.200.");
  expect(await meta(page, "twitter:card")).toBe("summary_large_image");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${origen}/propiedades/${slug("Con foto")}`);

  const imagen = (await meta(page, "og:image"))!;
  expect(imagen.startsWith(`${origen}/_next/image?`)).toBe(true);
  // Como la pide WhatsApp: sin anunciar WebP.
  const res = await request.get(imagen, { headers: { Accept: "image/jpeg,image/*" } });
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toMatch(/^image\//);
  expect((await res.body()).length).toBeLessThan(300_000);
});

test("ficha sin fotos e inicio usan la imagen de marca", async ({ page, request }) => {
  await page.goto(`/propiedades/${slug("Sin foto")}`);
  const imagen = (await meta(page, "og:image"))!;
  expect(imagen).toMatch(/\/compartir\.jpg$/);
  expect(await meta(page, "og:description")).toBe("Arriendo de departamento en Iquique. $ 650.000.");
  const res = await request.get(imagen);
  expect(res.status()).toBe(200);
  expect((await res.body()).length).toBeLessThan(150_000);

  await page.goto("/");
  expect(await meta(page, "og:image")).toMatch(/\/compartir\.jpg$/);
  expect(await meta(page, "og:site_name")).toBe("GyCmar Propiedades Iquique");
  expect(await meta(page, "og:locale")).toBe("es_CL");
});

test("datos estructurados de la ficha y de la corredora", async ({ page }) => {
  await page.goto(`/propiedades/${slug("Con foto")}`);
  const [ficha] = await jsonLd(page);
  expect(ficha["@type"]).toBe("RealEstateListing");
  expect(ficha.offers).toMatchObject({ price: 5200, priceCurrency: "CLF", availability: "https://schema.org/InStock" });
  expect(ficha.image).toHaveLength(1);
  expect(JSON.stringify(ficha)).not.toContain("Calle Secreta");

  await page.goto("/");
  const [corredora] = await jsonLd(page);
  expect(corredora).toMatchObject({ "@type": "RealEstateAgent", name: "GyCmar Propiedades Iquique" });
});

test("sitemap con fichas visibles, sin borradores, y actualizado desde el panel", async ({ request }) => {
  let xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain(`/propiedades/${slug("Con foto")}</loc>`);
  expect(xml).toContain(`/propiedades/${slug("Sin foto")}</loc>`);
  expect(xml).not.toContain(slug("Borrador"));
  expect(xml).not.toContain("/admin");

  await panel.goto("/admin");
  await panel.getByLabel(`Estado de ${t("Borrador")}`).selectOption("publicada");
  await expect(panel.getByLabel(`Estado de ${t("Borrador")}`)).toHaveValue("publicada");
  await expect.poll(async () => (await admin("GET", `/rest/v1/propiedades?select=estado&id=eq.${ids.Borrador}`)).data[0].estado).toBe("publicada");
  xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain(`/propiedades/${slug("Borrador")}</loc>`);
});

test("robots y canónica del listado con filtros", async ({ page, request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
  await page.goto("/propiedades?operacion=arriendo&orden=precio-asc");
  const origen = new URL(page.url()).origin;
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${origen}/propiedades`);
});
