import { describe, expect, it } from "vitest";
import { elegirUF, valorDeSerie } from "./leer";

describe("valorDeSerie", () => {
  it("toma el valor más reciente", () => {
    expect(valorDeSerie({ serie: [{ fecha: "2026-11-19", valor: 41364.17 }, { fecha: "2026-11-18", valor: 41357.3 }] })).toBe(41364.17);
  });
  it("rechaza formatos inesperados o valores absurdos", () => {
    for (const json of [null, {}, { serie: [] }, { serie: [{ valor: "41.364,17" }] }, { serie: [{ valor: 3 }] }]) {
      expect(() => valorDeSerie(json)).toThrow();
    }
  });
});

describe("elegirUF", () => {
  it("usa la fuente si responde", async () => {
    expect(await elegirUF(async () => 41000, "40000")).toBe(41000);
  });
  it("si la fuente falla, el respaldo, y avisa", async () => {
    const avisos: unknown[] = [];
    expect(await elegirUF(async () => { throw new Error("caída"); }, "40000", (e) => avisos.push(e))).toBe(40000);
    expect(avisos).toHaveLength(1);
  });
  it("sin fuente ni respaldo válido, null", async () => {
    expect(await elegirUF(null, undefined)).toBeNull();
    expect(await elegirUF(null, "no")).toBeNull();
    expect(await elegirUF(null, "40000")).toBe(40000);
  });
});
