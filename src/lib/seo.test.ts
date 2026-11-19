import { describe, expect, it } from "vitest";
import { IMAGEN_MARCA, descripcionFicha, imagenCompartir, jsonLdCorredora, jsonLdFicha, jsonLdTexto } from "./seo";

const ficha = {
  slug: "casa-cavancha", titulo: "Casa en Cavancha", descripcion: null, operacion: "venta", tipo: "casa",
  precio: 5200, moneda: "UF", sector: "Cavancha", comuna: "Iquique", region: "Tarapacá",
  direccion: "Calle Secreta 123", mostrar_direccion: false, dormitorios: 3, banos: 2, m2_utiles: 80,
  m2_totales: null, estado: "publicada", created_at: "2026-11-19T00:00:00Z", fotos: [{ path: "id/a.jpg" }],
};

describe("descripcionFicha", () => {
  it("operación, tipo, lugar y precio", () => {
    expect(descripcionFicha(ficha)).toBe("Venta de casa en Cavancha, Iquique. UF 5.200.");
    expect(descripcionFicha({ ...ficha, operacion: "arriendo", tipo: "departamento", sector: null, precio: 650000, moneda: "CLP" }))
      .toBe("Arriendo de departamento en Iquique. $ 650.000.");
  });
});

describe("imagenCompartir", () => {
  it("portada por el optimizador a 1200 px, o la imagen de marca", () => {
    const img = imagenCompartir("id/a.jpg", "Casa");
    expect(img.url).toMatch(/\/_next\/image\?url=.*id%2Fa\.jpg&w=1200&q=75$/);
    expect(img.url).toMatch(/^https?:\/\//);
    expect(imagenCompartir(null, "Casa")).toBe(IMAGEN_MARCA);
  });
});

describe("JSON-LD", () => {
  it("ficha: precio en CLF, disponible y sin dirección oculta", () => {
    const j = jsonLdFicha(ficha);
    expect(j.offers).toMatchObject({ price: 5200, priceCurrency: "CLF", availability: "https://schema.org/InStock" });
    expect(JSON.stringify(j)).not.toContain("Calle Secreta");
    expect(j.about).toMatchObject({ numberOfRooms: 3, numberOfBathroomsTotal: 2 });
  });
  it("ficha con dirección permitida, vendida y en pesos", () => {
    const j = jsonLdFicha({ ...ficha, mostrar_direccion: true, estado: "vendida", moneda: "CLP" });
    expect(j.about.address).toMatchObject({ streetAddress: "Calle Secreta 123" });
    expect(j.offers).toMatchObject({ priceCurrency: "CLP", availability: "https://schema.org/SoldOut" });
  });
  it("corredora sin teléfono ni Instagram no los inventa", () => {
    const j = jsonLdCorredora({ telefono: null });
    expect(j).not.toHaveProperty("telephone");
    expect(j["@type"]).toBe("RealEstateAgent");
    expect(jsonLdCorredora({ telefono: "56 9 1234 5678" })).toMatchObject({ telephone: "+56912345678" });
  });
  it("escapa < para no cerrar el script", () => {
    expect(jsonLdTexto({ a: "</script><b>" })).not.toContain("</script>");
  });
});
