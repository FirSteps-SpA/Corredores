import { test as base, type BrowserContext } from "@playwright/test";

// Las pruebas no salen a internet: las teselas de OpenStreetMap se responden con una imagen local y
// Nominatim (búsqueda de direcciones) sin resultados, salvo que un test la simule con otra respuesta.
const PNG_1X1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

export const teselasPedidas: string[] = [];

export async function sinInternet(contexto: BrowserContext) {
  await contexto.route("https://tile.openstreetmap.org/**", (route) => {
    teselasPedidas.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "image/png", body: PNG_1X1 });
  });
  await contexto.route("https://nominatim.openstreetmap.org/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
}

export const test = base.extend({
  context: async ({ context }, usar) => {
    await sinInternet(context);
    await usar(context);
  },
});
export { expect } from "@playwright/test";
