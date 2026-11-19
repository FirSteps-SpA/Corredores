import { describe, expect, it } from "vitest";
import { normalizar, slugDe, slugLibre } from "./slug";

describe("slugDe", () => {
  it("pasa a minúsculas y separa con guiones", () => {
    expect(slugDe("Casa en Cavancha, 3D 2B")).toBe("casa-en-cavancha-3d-2b");
  });
  it("quita tildes y la ñ", () => {
    expect(slugDe("Departamento Península Ñandú")).toBe("departamento-peninsula-nandu");
  });
  it("colapsa signos y espacios repetidos y limpia los extremos", () => {
    expect(slugDe("  ¡Oferta!!  Casa -- con   piscina?  ")).toBe("oferta-casa-con-piscina");
  });
  it("corta en 80 caracteres sin dejar un guion al final", () => {
    const slug = slugDe(`${"a".repeat(79)} b`);
    expect(slug).toBe("a".repeat(79));
    expect(slugDe("palabra ".repeat(20)).length).toBeLessThanOrEqual(80);
    expect(slugDe("palabra ".repeat(20))).not.toMatch(/-$/);
  });
  it("devuelve vacío si no hay letras ni dígitos", () => {
    expect(slugDe("¡¿?! —")).toBe("");
  });
  it("cumple el check de la tabla", () => {
    for (const t of ["Casa 1", "ÁÉÍÓÚ üñ", "a--b", "x"]) {
      expect(slugDe(t)).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });
});

describe("slugLibre", () => {
  it("usa la base si está libre", () => {
    expect(slugLibre("casa", ["otra"])).toBe("casa");
  });
  it("agrega el primer sufijo libre", () => {
    expect(slugLibre("casa", ["casa"])).toBe("casa-2");
    expect(slugLibre("casa", ["casa", "casa-2", "casa-4"])).toBe("casa-3");
  });
});

describe("normalizar", () => {
  it("permite comparar sin tildes ni mayúsculas", () => {
    expect(normalizar("Cavancha Río")).toBe(normalizar("cavancha rio"));
  });
});
