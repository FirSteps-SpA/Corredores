import type { Page } from "@playwright/test";
import { expect, teselasPedidas, test } from "./fixtures";
import { admin, borrarCuenta, crearCuenta, crearPropiedad, iniciarSesion, limpiarPropiedades, run } from "./supabase";

// Spec 8 (mapa). Teselas y Nominatim se responden localmente (fixtures.ts).

let cuenta: { id: string; email: string };
let panel: Page;
const t = (n: string) => `${n} ${run}`;
const slug = (n: string) => `${n.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${run}`;
const ids: Record<string, string> = {};
const EXACTA = { lat: -20.2425, lng: -70.1412 };

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

const ubicacion = async (nombre: string) =>
  (await admin("GET", `/rest/v1/propiedades?select=lat,lng&id=eq.${ids[nombre]}`)).data[0] as { lat: number | null; lng: number | null };

async function abrirFormulario(nombre: string) {
  await panel.goto(`/admin/propiedades/${ids[nombre]}`);
  const mapa = panel.getByLabel("Mapa para marcar la ubicación");
  await expect(mapa).toHaveClass(/leaflet-container/);
  return mapa;
}

async function guardar() {
  await panel.getByRole("button", { name: "Guardar" }).click();
  await expect(panel).toHaveURL(/\/admin\?guardada=/);
}

test.beforeAll(async ({ browser }) => {
  test.setTimeout(90_000);
  cuenta = await crearCuenta("mapa", true);
  panel = await iniciarSesion(browser, cuenta.email);
  await crearPropiedad("Ancla");
  // Descripción larga, como una ficha real: deja el mapa bien abajo para la prueba de carga diferida.
  const descripcion = Array.from({ length: 30 }, (_, i) => `Línea ${i + 1} de la descripción.`).join("\n");
  await propiedad("Exacta", { estado: "publicada", direccion: "Avenida Visible 456", mostrar_direccion: true, sector: "Cavancha", descripcion, ...EXACTA });
  await propiedad("Oculta", { estado: "publicada", direccion: "Calle Secreta 123", mostrar_direccion: false, sector: "Cavancha", ...EXACTA });
  await propiedad("Sin ubicacion", { estado: "publicada" });
  await propiedad("Para marcar", { estado: "borrador", direccion: "Avenida Arturo Prat 1000" });
  await invalidar();
});

test.afterAll(async () => {
  await limpiarPropiedades();
  await borrarCuenta(cuenta.id);
});

test("panel: marcar con un clic, ubicar por dirección y quitar", async () => {
  // Clic en el mapa (centrado en Iquique) y guardar.
  let mapa = await abrirFormulario("Para marcar");
  await mapa.click({ position: { x: 200, y: 100 } });
  await expect(panel.locator('input[name="lat"]')).not.toHaveValue("");
  await guardar();
  const marcada = await ubicacion("Para marcar");
  expect(marcada.lat).toBeGreaterThan(-20.4);
  expect(marcada.lat).toBeLessThan(-20.1);
  expect(marcada.lng).toBeGreaterThan(-70.3);
  expect(marcada.lng).toBeLessThan(-70);

  // Ubicar por dirección (Nominatim simulado) y guardar.
  mapa = await abrirFormulario("Para marcar");
  let consulta = "";
  await panel.route("https://nominatim.openstreetmap.org/**", (route) => {
    consulta = new URL(route.request().url()).searchParams.get("q") ?? "";
    return route.fulfill({ contentType: "application/json", body: JSON.stringify([{ lat: "-20.2201", lon: "-70.1433" }]) });
  });
  await panel.getByRole("button", { name: "Ubicar por dirección" }).click();
  await expect(panel.locator('input[name="lat"]')).toHaveValue("-20.2201");
  expect(consulta).toBe("Avenida Arturo Prat 1000, Iquique, Chile");
  await guardar();
  expect(await ubicacion("Para marcar")).toEqual({ lat: -20.2201, lng: -70.1433 });
  await panel.unroute("https://nominatim.openstreetmap.org/**");

  // Dirección no encontrada: aviso y el marcador no cambia (Nominatim responde [] por defecto).
  await abrirFormulario("Para marcar");
  await panel.getByRole("button", { name: "Ubicar por dirección" }).click();
  await expect(panel.getByText("No encontramos esa dirección")).toBeVisible();
  await expect(panel.locator('input[name="lat"]')).toHaveValue("-20.2201");

  // Quitar la ubicación y guardar.
  await panel.getByRole("button", { name: "Quitar ubicación" }).click();
  await expect(panel.locator('input[name="lat"]')).toHaveValue("");
  await guardar();
  expect(await ubicacion("Para marcar")).toEqual({ lat: null, lng: null });
});

test("ficha con dirección visible: marcador en el punto exacto", async ({ page }) => {
  await page.goto(`/propiedades/${slug("Exacta")}`);
  await page.getByRole("heading", { name: "Ubicación" }).scrollIntoViewIfNeeded();
  await expect(page.locator(".leaflet-marker-icon")).toBeVisible();
  await expect(page.getByText("Ubicación aproximada")).toHaveCount(0);
  const [ficha] = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(JSON.parse(ficha).about.geo).toMatchObject({ latitude: EXACTA.lat, longitude: EXACTA.lng });
});

test("ficha con dirección oculta: zona aproximada sin las coordenadas exactas", async ({ page }) => {
  await page.goto(`/propiedades/${slug("Oculta")}`);
  await page.getByRole("heading", { name: "Ubicación" }).scrollIntoViewIfNeeded();
  await expect(page.getByText(/Ubicación aproximada/)).toBeVisible();
  await expect(page.locator("path.leaflet-interactive")).toBeVisible();
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(0);
  const html = await page.content();
  for (const dato of ["Calle Secreta", String(EXACTA.lat), String(EXACTA.lng)]) expect(html).not.toContain(dato);
  const [ficha] = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(JSON.parse(ficha).about).not.toHaveProperty("geo");
});

test("ficha sin ubicación: sin mapa", async ({ page }) => {
  await page.goto(`/propiedades/${slug("Sin ubicacion")}`);
  await expect(page.getByRole("heading", { name: "Descripción" }).or(page.getByRole("heading", { level: 1 }))).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Ubicación" })).toHaveCount(0);
});

test("el mapa no pide teselas hasta acercarse a la sección", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const antes = teselasPedidas.length;
  await page.goto(`/propiedades/${slug("Exacta")}`);
  const top = await page.getByRole("heading", { name: "Ubicación" }).evaluate((e) => e.getBoundingClientRect().top);
  expect(top).toBeGreaterThan(700 + 200); // fuera de pantalla y del margen de anticipación
  await page.waitForTimeout(1500);
  expect(teselasPedidas.length).toBe(antes);
  await page.getByRole("heading", { name: "Ubicación" }).scrollIntoViewIfNeeded();
  await expect.poll(() => teselasPedidas.length).toBeGreaterThan(antes);
});
