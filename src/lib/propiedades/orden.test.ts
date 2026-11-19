import { describe, expect, it } from "vitest";
import { ordenPublico } from "./orden";

const p = (id: string, estado: string, destacada: boolean, updated_at: string) => ({ id, estado, destacada, updated_at });

describe("ordenPublico", () => {
  it("disponibles antes que cerradas, aunque la cerrada sea más reciente", () => {
    const r = ordenPublico([p("vendida", "vendida", false, "2026-11-19"), p("publicada", "publicada", false, "2026-11-18")]);
    expect(r.map((x) => x.id)).toEqual(["publicada", "vendida"]);
  });
  it("destacadas primero entre las disponibles; luego por fecha", () => {
    const r = ordenPublico([
      p("a", "publicada", false, "2026-11-19"),
      p("b", "reservada", true, "2026-11-10"),
      p("c", "publicada", true, "2026-11-12"),
      p("d", "arrendada", true, "2026-11-19"),
      p("e", "vendida", false, "2026-11-01"),
    ]);
    expect(r.map((x) => x.id)).toEqual(["c", "b", "a", "d", "e"]);
  });
  it("no modifica el arreglo original", () => {
    const original = [p("a", "vendida", false, "1"), p("b", "publicada", false, "1")];
    ordenPublico(original);
    expect(original[0].id).toBe("a");
  });
});
