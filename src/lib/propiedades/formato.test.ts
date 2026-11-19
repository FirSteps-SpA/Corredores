import { describe, expect, it } from "vitest";
import { numeroCampo, precioTexto } from "./formato";

describe("precioTexto", () => {
  it("UF con separador de miles", () => {
    expect(precioTexto(4500, "UF")).toBe("UF 4.500");
  });
  it("UF con decimales", () => {
    expect(precioTexto(4500.5, "UF")).toBe("UF 4.500,5");
    expect(precioTexto(12.25, "UF")).toBe("UF 12,25");
  });
  it("pesos sin decimales", () => {
    expect(precioTexto(350000, "CLP")).toBe("$ 350.000");
    expect(precioTexto(1250000000, "CLP")).toBe("$ 1.250.000.000");
  });
});

describe("numeroCampo", () => {
  it("usa coma decimal y deja vacío lo nulo", () => {
    expect(numeroCampo(4500.5)).toBe("4500,5");
    expect(numeroCampo(3)).toBe("3");
    expect(numeroCampo(null)).toBe("");
  });
});
