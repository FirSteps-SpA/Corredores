import { describe, expect, it } from "vitest";
import { aParams, enMoneda, filtrar, hayFiltros, leerFiltros, opcionesDe, ordenar, paginar } from "./filtros";

const base = {
  operacion: "venta", tipo: "casa", comuna: "Iquique", sector: "Cavancha", precio: 4000, moneda: "UF",
  dormitorios: 3, banos: 2, estado: "publicada", destacada: false, updated_at: "2026-11-10",
};
const p = (id: string, extra: Record<string, unknown> = {}) => ({ id, ...base, ...extra }) as typeof base & { id: string; dormitorios: number | null };
const ids = (l: { id: string }[]) => l.map((x) => x.id);
const UF = 40000;

describe("leerFiltros", () => {
  it("sin parámetros: por defecto", () => {
    expect(leerFiltros({})).toEqual({ moneda: "UF", disponibles: false, orden: "relevantes", pagina: 1, operacion: undefined, tipo: undefined, comuna: undefined, sector: undefined, desde: undefined, hasta: undefined, dormitorios: undefined, banos: undefined });
  });
  it("lee y valida; ignora lo inválido", () => {
    const f = leerFiltros({ operacion: "arriendo", tipo: "castillo", desde: "abc", hasta: "700.000", dormitorios: "3", banos: "-1", orden: "raro", pagina: "x", disponibles: "1" });
    expect(f).toMatchObject({ operacion: "arriendo", tipo: undefined, desde: undefined, hasta: 700000, moneda: "CLP", dormitorios: 3, banos: undefined, orden: "relevantes", pagina: 1, disponibles: true });
  });
  it("moneda por defecto según la operación, salvo que venga explícita", () => {
    expect(leerFiltros({ operacion: "venta" }).moneda).toBe("UF");
    expect(leerFiltros({ operacion: "arriendo" }).moneda).toBe("CLP");
    expect(leerFiltros({ operacion: "arriendo", moneda: "UF" }).moneda).toBe("UF");
  });
  it("expande el rango del buscador del inicio; lo explícito tiene prioridad", () => {
    expect(leerFiltros({ rango: "arriendo:CLP:400000:700000" })).toMatchObject({ operacion: "arriendo", moneda: "CLP", desde: 400000, hasta: 700000 });
    expect(leerFiltros({ rango: "venta:UF:8000:" })).toMatchObject({ operacion: "venta", desde: 8000, hasta: undefined });
    expect(leerFiltros({ rango: "venta:UF:0:3000" })).toMatchObject({ desde: undefined, hasta: 3000 });
    expect(leerFiltros({ rango: "venta:UF:0:3000", hasta: "2500" }).hasta).toBe(2500);
    expect(leerFiltros({ rango: "permuta:USD:1:2" }).operacion).toBeUndefined();
  });
});

describe("filtrar", () => {
  const lista = [
    p("venta-uf"),
    p("venta-clp", { precio: 160_000_000, moneda: "CLP" }),
    p("arriendo", { operacion: "arriendo", tipo: "departamento", precio: 650000, moneda: "CLP", sector: "Playa Brava" }),
    p("sin-dorm", { dormitorios: null }),
    p("vendida", { estado: "vendida" }),
  ];
  it("por operación, tipo, comuna y sector sin tildes", () => {
    expect(ids(filtrar(lista, leerFiltros({ operacion: "arriendo", tipo: "departamento", comuna: "IQUIQUE" }), UF))).toEqual(["arriendo"]);
    expect(ids(filtrar(lista, leerFiltros({ sector: "playa brava" }), UF))).toEqual(["arriendo"]);
  });
  it("dormitorios mínimos excluye a las que no lo indican", () => {
    expect(ids(filtrar(lista, leerFiltros({ dormitorios: "3" }), UF))).not.toContain("sin-dorm");
  });
  it("venta en pesos dentro de un rango en UF con la UF del día", () => {
    expect(ids(filtrar(lista, leerFiltros({ desde: "3000", hasta: "5000", moneda: "UF" }), UF))).toEqual(["venta-uf", "venta-clp", "sin-dorm", "vendida"]);
  });
  it("sin UF solo compara la misma moneda", () => {
    expect(ids(filtrar(lista, leerFiltros({ hasta: "5000", moneda: "UF" }), null))).toEqual(["venta-uf", "sin-dorm", "vendida"]);
  });
  it("ocultar vendidas y arrendadas", () => {
    expect(ids(filtrar(lista, leerFiltros({ disponibles: "1" }), UF))).not.toContain("vendida");
  });
});

describe("ordenar", () => {
  const lista = [
    p("cara-clp", { precio: 400_000_000, moneda: "CLP" }), // 10.000 UF
    p("barata", { precio: 2000 }),
    p("vendida-barata", { precio: 100, estado: "vendida" }),
    p("media", { precio: 5000, updated_at: "2026-11-19" }),
  ];
  it("precio menor a mayor, con conversión y cerradas al final", () => {
    expect(ids(ordenar(lista, "precio-asc", "UF", UF))).toEqual(["barata", "media", "cara-clp", "vendida-barata"]);
    expect(ids(ordenar(lista, "precio-desc", "UF", UF))).toEqual(["cara-clp", "media", "barata", "vendida-barata"]);
  });
  it("sin UF, la otra moneda va después", () => {
    expect(ids(ordenar(lista, "precio-asc", "UF", null))).toEqual(["barata", "media", "cara-clp", "vendida-barata"]);
  });
  it("más recientes", () => {
    expect(ids(ordenar(lista, "recientes", "UF", UF))[0]).toBe("media");
  });
});

describe("paginar y enlaces", () => {
  const lista = Array.from({ length: 14 }, (_, i) => i);
  it("12 por página y página fuera de rango → la última", () => {
    expect(paginar(lista, 1)).toMatchObject({ pagina: 1, totalPaginas: 2, total: 14 });
    expect(paginar(lista, 2).items).toEqual([12, 13]);
    expect(paginar(lista, 9).pagina).toBe(2);
    expect(paginar([], 3)).toMatchObject({ pagina: 1, totalPaginas: 1, items: [] });
  });
  it("aParams conserva filtros y cambia la página", () => {
    const f = leerFiltros({ operacion: "arriendo", hasta: "700000", orden: "precio-asc" });
    expect(aParams(f, { pagina: 2 })).toBe("?operacion=arriendo&hasta=700000&moneda=CLP&orden=precio-asc&pagina=2");
    expect(aParams(leerFiltros({}))).toBe("");
    expect(hayFiltros(f)).toBe(true);
    expect(hayFiltros(leerFiltros({ orden: "recientes" }))).toBe(false);
  });
  it("opciones sin repetir y ordenadas", () => {
    expect(opcionesDe([{ comuna: "Iquique", sector: "Península" }, { comuna: "iquique", sector: null }, { comuna: "Alto Hospicio", sector: "peninsula" }]))
      .toEqual({ comunas: ["Alto Hospicio", "Iquique"], sectores: ["Península"] });
  });
  it("enMoneda", () => {
    expect(enMoneda(160_000_000, "CLP", "UF", UF)).toBe(4000);
    expect(enMoneda(10, "UF", "CLP", UF)).toBe(400000);
    expect(enMoneda(10, "UF", "UF", null)).toBe(10);
    expect(enMoneda(10, "CLP", "UF", null)).toBeNull();
  });
});
