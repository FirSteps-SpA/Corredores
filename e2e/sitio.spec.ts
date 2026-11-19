import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { admin, borrarCuenta, crearCuenta, crearPropiedad, iniciarSesion, limpiarPropiedades, run, subirFoto } from "./supabase";

// Spec 5 (sitio-publico). El catálogo público está cacheado ("use cache"): los datos que se
// preparan directo en la base no se ven hasta que el panel invalida la etiqueta "propiedades".
// Por eso cada preparación termina con invalidar(), que usa el panel como la corredora.

let cuenta: { id: string; email: string };
let panel: Page;
const t = (nombre: string) => `${nombre} ${run}`;
const slug = (nombre: string) => `${nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${run}`;
const ids: Record<string, string> = {};

async function propiedad(nombre: string, datos: Record<string, unknown>) {
  const id = await crearPropiedad(nombre);
  await admin("PATCH", `/rest/v1/propiedades?id=eq.${id}`, datos);
  ids[nombre] = id;
  return id;
}

// Alterna dos veces la estrella de la propiedad ancla (un borrador): cada clic corre
// alternarDestacada, que llama a updateTag("propiedades").
async function invalidar() {
  await panel.goto("/admin");
  const fila = panel.locator("tr", { hasText: t("Ancla") });
  for (let i = 0; i < 2; i++) {
    const antes = await fila.getByRole("button", { name: /Destacar|Quitar de destacadas/ }).getAttribute("aria-pressed");
    await fila.getByRole("button", { name: /Destacar|Quitar de destacadas/ }).click();
    await expect(fila.getByRole("button", { name: /Destacar|Quitar de destacadas/ })).not.toHaveAttribute("aria-pressed", antes!);
  }
}

test.beforeAll(async ({ browser }) => {
  cuenta = await crearCuenta("sitio", true);
  panel = await iniciarSesion(browser, cuenta.email);
  await crearPropiedad("Ancla");
  await propiedad("Destacada", {
    estado: "publicada", destacada: true, codigo: `S-${run}`, direccion: "Calle Secreta 123", mostrar_direccion: false,
    sector: "Cavancha", dormitorios: 3, banos: 2, m2_utiles: 80, descripcion: "Primera línea.\nSegunda línea.",
  });
  await subirFoto(panel, ids.Destacada, 0, "#2a6f97");
  await subirFoto(panel, ids.Destacada, 1, "#c89860");
  await propiedad("Visible", { estado: "publicada", direccion: "Avenida Visible 456", mostrar_direccion: true, sector: "Playa Brava" });
  await propiedad("Reservada", { estado: "reservada" });
  await propiedad("Vendida", { estado: "vendida", destacada: true });
  await propiedad("Borrador", { estado: "borrador", destacada: true });
  await invalidar();
});

test.afterAll(async () => {
  await limpiarPropiedades();
  await borrarCuenta(cuenta.id);
});

test("inicio: solo disponibles, destacadas primero", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Tu propiedad.");
  const destacadas = page.locator("section", { has: page.locator("#destacadas") }).locator("article");
  await expect(destacadas.first()).toContainText(t("Destacada"));
  await expect(page.getByText(t("Vendida"))).toHaveCount(0);
  await expect(page.getByText(t("Borrador"))).toHaveCount(0);
  await expect(page.getByText("Sitio en construcción")).toHaveCount(0);
});

test("listado: orden, etiquetas y sin borradores", async ({ page }) => {
  await page.goto("/propiedades");
  const titulos = await page.locator("article h3").allTextContents();
  const mias = titulos.filter((x) => x.endsWith(run));
  expect(mias[0]).toBe(t("Destacada"));
  expect(mias.at(-1)).toBe(t("Vendida"));
  expect(mias).not.toContain(t("Borrador"));
  expect(mias).not.toContain(t("Ancla"));
  expect(new Set(mias)).toEqual(new Set([t("Destacada"), t("Visible"), t("Reservada"), t("Vendida")]));
  await expect(page.locator("article", { hasText: t("Reservada") })).toContainText("Reservada");
  await expect(page.locator("article", { hasText: t("Vendida") })).toContainText("Vendida");
});

test("ficha: fotos en orden, dirección oculta y WhatsApp con el mensaje", async ({ page }) => {
  await page.goto(`/propiedades/${slug("Destacada")}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(t("Destacada"));
  await expect(page).toHaveTitle(`${t("Destacada")} · GyCmar Propiedades Iquique`);
  await expect(page.getByRole("img", { name: `${t("Destacada")} – foto 1 de 2` })).toBeVisible();
  await expect(page.getByRole("img", { name: `${t("Destacada")} – foto 2 de 2` })).toBeAttached();
  expect(await page.content()).not.toContain("Calle Secreta");
  await expect(page.getByText("Cavancha, Iquique")).toBeVisible();
  await expect(page.getByText("Segunda línea.")).toBeVisible();

  const whatsapp = page.getByRole("link", { name: "Consultar por WhatsApp" });
  const href = new URL((await whatsapp.getAttribute("href"))!);
  expect(href.origin + href.pathname).toMatch(/^https:\/\/wa\.me\/\d+$/);
  const mensaje = href.searchParams.get("text")!;
  expect(mensaje).toMatch(new RegExp(`^Hola, me interesa la propiedad S-${run} – ${t("Destacada")}: https?://.+/propiedades/${slug("Destacada")}$`));
});

test("ficha: dirección visible, sin fotos, vendida sin botón", async ({ page }) => {
  await page.goto(`/propiedades/${slug("Visible")}`);
  await expect(page.getByText("Avenida Visible 456, Playa Brava, Iquique")).toBeVisible();
  await expect(page.getByRole("link", { name: "Consultar por WhatsApp" })).toBeVisible();

  await page.goto(`/propiedades/${slug("Vendida")}`);
  await expect(page.getByText("Esta propiedad ya fue vendida.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Consultar por WhatsApp" })).toHaveCount(0);
});

test("borrador e inexistente: no encontrada y sin datos", async ({ page }) => {
  for (const ruta of [`/propiedades/${slug("Borrador")}`, `/propiedades/no-existe-${run}`]) {
    const res = await page.goto(ruta);
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Propiedad no encontrada" })).toBeVisible();
    expect(await page.content()).not.toContain(t("Borrador"));
    // Next la marca noindex (en el navegador aparece en head y en body por el streaming).
    const robots = await page.locator('meta[name="robots"]').evaluateAll((m) => m.map((x) => x.getAttribute("content")));
    expect(robots.length).toBeGreaterThan(0);
    expect(robots.every((c) => c?.includes("noindex"))).toBe(true);
  }
});

test("contacto: muestra solo los datos configurados", async ({ page }) => {
  await page.goto("/contacto");
  await expect(page.getByRole("link", { name: /WhatsApp/ }).first()).toHaveAttribute("href", /^https:\/\/wa\.me\/\d+/);
  // Mismas variables que la build (en CI: WhatsApp e Instagram, sin correo).
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(process.env.NEXT_PUBLIC_CONTACTO_EMAIL ? 1 : 0);
  await expect(page.locator('a[href*="instagram.com"]').first()).toBeAttached({ attached: !!process.env.NEXT_PUBLIC_INSTAGRAM });
});

test("celular: menú y portadas en tamaño reducido", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/propiedades");
  const portada = page.locator("article img").first();
  await expect(portada).toBeVisible();
  const src = await portada.evaluate((img: HTMLImageElement) => img.currentSrc);
  expect(src).toContain("/_next/image");
  expect(Number(new URL(src).searchParams.get("w"))).toBeLessThan(1600);

  await page.getByLabel("Menú").first().click();
  await page.getByRole("navigation", { name: "Menú" }).getByRole("link", { name: "Contacto" }).click();
  await expect(page).toHaveURL(/\/contacto$/);
  await expect(page.getByRole("navigation", { name: "Menú" })).toBeHidden();
});

test("el panel enlaza a la ficha pública si no es borrador", async () => {
  await panel.goto(`/admin/propiedades/${ids.Destacada}`);
  await expect(panel.getByRole("link", { name: "Ver en el sitio ↗" })).toHaveAttribute("href", `/propiedades/${slug("Destacada")}`);
  await panel.goto(`/admin/propiedades/${ids.Borrador}`);
  await expect(panel.getByText("Visible en el sitio cuando la publiques")).toBeVisible();
});

test("lo que la corredora publica o retira en el panel se ve en el sitio", async ({ page }) => {
  const nombre = t("Borrador");
  await panel.goto("/admin");
  await panel.getByLabel(`Estado de ${nombre}`).selectOption("publicada");
  await expect.poll(async () => (await admin("GET", `/rest/v1/propiedades?select=estado&id=eq.${ids.Borrador}`)).data[0].estado).toBe("publicada");
  // El panel sigue mostrando el estado nuevo (React 19 restablecía el <select> al anterior).
  await panel.waitForLoadState("networkidle");
  await expect(panel.getByLabel(`Estado de ${nombre}`)).toHaveValue("publicada");
  await page.goto("/propiedades");
  await expect(page.locator("article h3", { hasText: nombre })).toBeVisible();
  // Su ficha no se generó en el build: se genera en esta primera visita (en Netlify, con el
  // App Shell por defecto, respondía 500).
  const res = await page.goto(`/propiedades/${slug("Borrador")}`);
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(nombre);

  await panel.goto("/admin");
  await panel.getByLabel(`Estado de ${nombre}`).selectOption("borrador");
  await expect.poll(async () => (await admin("GET", `/rest/v1/propiedades?select=estado&id=eq.${ids.Borrador}`)).data[0].estado).toBe("borrador");
  await panel.waitForLoadState("networkidle");
  await expect(panel.getByLabel(`Estado de ${nombre}`)).toHaveValue("borrador");
  await page.goto(`/propiedades/${slug("Borrador")}`);
  await expect(page.getByRole("heading", { name: "Propiedad no encontrada" })).toBeVisible();
});
