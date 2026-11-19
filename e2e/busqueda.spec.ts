import type { Page } from "@playwright/test";
import { expect, sinInternet, test } from "./fixtures";
import { admin, borrarCuenta, crearCuenta, crearPropiedad, iniciarSesion, limpiarPropiedades, run } from "./supabase";

// Spec 6 (busqueda-y-filtros). La app corre con UF_FUENTE=ninguna y UF_RESPALDO=40000: la UF
// vale $40.000 y los resultados no dependen de un servicio externo. Todas las propiedades de esta
// corrida están en una comuna propia, así los conteos no dependen de otros datos de la base.

const COMUNA = `Comuna ${run}`;
let cuenta: { id: string; email: string };
let panel: Page;

async function propiedad(nombre: string, datos: Record<string, unknown>) {
  const id = await crearPropiedad(nombre);
  await admin("PATCH", `/rest/v1/propiedades?id=eq.${id}`, { comuna: COMUNA, estado: "publicada", ...datos });
}

// Ver spec 5: los datos preparados en la base se ven en el sitio cuando el panel invalida la caché.
async function invalidar() {
  await panel.goto("/admin");
  const estrella = panel.locator("tr", { hasText: `Ancla ${run}` }).getByRole("button", { name: /Destacar|Quitar de destacadas/ });
  for (let i = 0; i < 2; i++) {
    const antes = await estrella.getAttribute("aria-pressed");
    await estrella.click();
    await expect(estrella).not.toHaveAttribute("aria-pressed", antes!);
  }
}

const titulos = async (page: Page) =>
  (await page.locator("article h3").allTextContents()).filter((t) => t.endsWith(run)).map((t) => t.replace(` ${run}`, ""));

test.beforeAll(async ({ browser }) => {
  test.setTimeout(120_000);
  cuenta = await crearCuenta("busqueda", true);
  panel = await iniciarSesion(browser, cuenta.email);
  await crearPropiedad("Ancla");
  await propiedad("Casa UF", { tipo: "casa", precio: 4000, moneda: "UF", sector: "Cavancha", dormitorios: 3, banos: 2 });
  await propiedad("Depto pesos", { tipo: "departamento", precio: 160_000_000, moneda: "CLP", dormitorios: 2, banos: 1 });
  await propiedad("Arriendo barato", { operacion: "arriendo", tipo: "departamento", precio: 650_000, moneda: "CLP", sector: "Playa Brava", dormitorios: 2 });
  await propiedad("Arriendo caro", { operacion: "arriendo", tipo: "departamento", precio: 900_000, moneda: "CLP" });
  await propiedad("Vendida", { tipo: "casa", precio: 500, moneda: "UF", estado: "vendida" });
  for (let i = 1; i <= 9; i++) await propiedad(`Relleno ${i}`, { tipo: "casa", precio: 1000 + i, moneda: "UF", dormitorios: 1 });
  await invalidar();
});

test.afterAll(async () => {
  await limpiarPropiedades();
  await borrarCuenta(cuenta.id);
});

const url = (q: Record<string, string>) => `/propiedades?${new URLSearchParams({ comuna: COMUNA, ...q })}`;

test("filtros combinados en la URL, con el formulario marcado", async ({ page }) => {
  await page.goto(url({ operacion: "arriendo", tipo: "departamento" }));
  expect(new Set(await titulos(page))).toEqual(new Set(["Arriendo barato", "Arriendo caro"]));
  const form = page.getByRole("form", { name: "Filtros" });
  await expect(form.getByLabel("Operación")).toHaveValue("arriendo");
  await expect(form.getByLabel("Tipo")).toHaveValue("departamento");
  await expect(form.getByLabel("Comuna")).toHaveValue(COMUNA);
});

test("sector sin tildes, dormitorios mínimos y ocultar cerradas", async ({ page }) => {
  await page.goto(url({ sector: "playa brava" }));
  expect(await titulos(page)).toEqual(["Arriendo barato"]);
  await page.goto(url({ dormitorios: "3" }));
  expect(await titulos(page)).toEqual(["Casa UF"]);
  await page.goto(url({ disponibles: "1" }));
  expect(await titulos(page)).not.toContain("Vendida");
});

test("una venta en pesos entra en un rango en UF con la UF del día", async ({ page }) => {
  await page.goto(url({ desde: "3000", hasta: "5000", moneda: "UF" }));
  expect(new Set(await titulos(page))).toEqual(new Set(["Casa UF", "Depto pesos"]));
  await expect(page.locator("article", { hasText: "Depto pesos" })).toContainText("$ 160.000.000");
});

test("orden por precio con cerradas al final", async ({ page }) => {
  await page.goto(url({ operacion: "venta", orden: "precio-asc" }));
  const lista = await titulos(page);
  expect(lista.slice(0, 2)).toEqual(["Relleno 1", "Relleno 2"]);
  await page.goto(url({ operacion: "venta", orden: "precio-desc" }));
  const desc = await titulos(page);
  // Casa UF (4.000 UF) y Depto pesos ($160.000.000 = 4.000 UF) empatan: cualquier orden entre ellas.
  expect(new Set(desc.slice(0, 2))).toEqual(new Set(["Casa UF", "Depto pesos"]));
  expect(desc.at(-1)).toBe("Vendida");
});

test("paginación de 12 con filtros conservados", async ({ page }) => {
  await page.goto(url({}));
  await expect(page.getByText("14 propiedades")).toBeVisible();
  expect(await titulos(page)).toHaveLength(12);
  await page.getByRole("navigation", { name: "Páginas" }).getByRole("link", { name: "2" }).click();
  await expect(page).toHaveURL(/pagina=2/);
  await expect(page).toHaveURL(new RegExp(`comuna=Comuna`));
  expect(await titulos(page)).toHaveLength(2);
  await page.goto(url({ pagina: "9" }));
  await expect(page.getByRole("link", { name: "2" }).and(page.locator('[aria-current="page"]'))).toBeVisible();
});

test("valores inválidos se ignoran y sin resultados se puede limpiar", async ({ page }) => {
  await page.goto(url({ operacion: "arriendo", tipo: "castillo", dormitorios: "muchos" }));
  expect(new Set(await titulos(page))).toEqual(new Set(["Arriendo barato", "Arriendo caro"]));
  await page.goto(url({ hasta: "1" }));
  await expect(page.getByText("No hay propiedades que coincidan")).toBeVisible();
  await page.getByRole("link", { name: "Limpiar filtros" }).first().click();
  await expect(page).toHaveURL(/\/propiedades$/);
});

test("buscador del inicio", async ({ page }) => {
  await page.goto("/");
  const buscador = page.getByRole("form", { name: "Buscar propiedades" });
  await buscador.getByLabel("Tipo de propiedad").selectOption("departamento");
  await buscador.getByLabel("Comuna").selectOption(COMUNA);
  await buscador.getByLabel("Rango de precio").selectOption("arriendo:CLP:400000:700000");
  await buscador.getByRole("button", { name: "Buscar" }).click();
  await expect(page).toHaveURL(/\/propiedades\?/);
  expect(await titulos(page)).toEqual(["Arriendo barato"]);
});

test("filtros sin JavaScript", async ({ browser }) => {
  const contexto = await browser.newContext({ javaScriptEnabled: false });
  await sinInternet(contexto);
  const page = await contexto.newPage();
  await page.goto(url({}));
  const form = page.getByRole("form", { name: "Filtros" });
  await form.getByLabel("Operación").selectOption("arriendo");
  await form.getByRole("button", { name: "Filtrar" }).click();
  await expect(page).toHaveURL(/operacion=arriendo/);
  expect(new Set(await titulos(page))).toEqual(new Set(["Arriendo barato", "Arriendo caro"]));
  await contexto.close();
});
