import { describe, expect, it } from "vitest";
import { leerNumero, leerPropiedad } from "./esquema";

function formulario(campos: Record<string, string | string[]>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) for (const x of [v].flat()) fd.append(k, x);
  return fd;
}

const minimo = {
  titulo: "Casa en Cavancha",
  operacion: "venta",
  tipo: "casa",
  precio: "4.500",
  moneda: "UF",
  comuna: "Iquique",
  estado: "borrador",
};

const leer = (extra: Record<string, string | string[]> = {}) => leerPropiedad(formulario({ ...minimo, ...extra }));
const error = (extra: Record<string, string | string[]>, campo: string) => {
  const r = leer(extra);
  return r.ok ? undefined : r.errores[campo];
};

describe("leerNumero", () => {
  it.each([
    ["350.000", 350000],
    ["1.250.000", 1250000],
    ["4.500,5", 4500.5],
    ["4,5", 4.5],
    ["4.5", 4.5],
    ["4500", 4500],
    [" $ 350.000 ", 350000],
    ["-3", -3],
  ])("%s → %d", (t, n) => expect(leerNumero(t)).toBe(n));
  it("vacío es null y texto es NaN", () => {
    expect(leerNumero("  ")).toBeNull();
    expect(leerNumero("mucho")).toBeNaN();
    expect(leerNumero("4.50.0")).toBeNaN();
  });
});

describe("leerPropiedad", () => {
  it("propiedad mínima con valores por defecto", () => {
    const r = leer();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.datos).toMatchObject({
      titulo: "Casa en Cavancha",
      slug: "casa-en-cavancha",
      precio: 4500,
      moneda: "UF",
      codigo: null,
      dormitorios: null,
      mostrar_direccion: false,
      destacada: false,
      caracteristicas: [],
    });
  });

  it.each([
    ["titulo", { titulo: "  " }],
    ["precio", { precio: "" }],
    ["comuna", { comuna: "" }],
    ["operacion", { operacion: "permuta" }],
    ["tipo", { tipo: "castillo" }],
    ["moneda", { moneda: "USD" }],
    ["estado", { estado: "archivada" }],
  ])("rechaza %s inválido u obligatorio vacío", (campo, extra) => {
    expect(error(extra, campo)).toBeTruthy();
  });

  it("rechaza negativos y no números", () => {
    expect(error({ dormitorios: "-2" }, "dormitorios")).toBe("No puede ser negativo.");
    expect(error({ m2_utiles: "-1" }, "m2_utiles")).toBe("No puede ser negativo.");
    expect(error({ precio: "mucho" }, "precio")).toBe("Debe ser un número.");
  });

  it("exige enteros en cantidades", () => {
    expect(error({ banos: "1,5" }, "banos")).toBe("Debe ser un número entero.");
  });

  it("acepta decimales en UF pero no en pesos", () => {
    expect(leer({ precio: "4.500,5" }).ok).toBe(true);
    expect(error({ precio: "350000,5", moneda: "CLP" }, "precio")).toBe("Un precio en pesos no lleva decimales.");
    expect(leer({ precio: "350.000", moneda: "CLP" }).ok).toBe(true);
  });

  it("normaliza el slug escrito o lo genera del título", () => {
    const r = leer({ slug: "Mi Casa Ñuñoa" });
    expect(r.ok && r.datos.slug).toBe("mi-casa-nunoa");
    expect(error({ titulo: "¡¿?!", slug: "" }, "slug")).toBeTruthy();
  });

  it("junta características marcadas y escritas sin repetir", () => {
    const r = leer({ caracteristicas: ["piscina", "quincho"], caracteristicas_otras: " Piscina, sala de juegos ,  ,jardín" });
    expect(r.ok && r.datos.caracteristicas).toEqual(["piscina", "quincho", "sala de juegos", "jardín"]);
  });

  it("lee las casillas de destacada y mostrar dirección", () => {
    const r = leer({ destacada: "on", mostrar_direccion: "on" });
    expect(r.ok && [r.datos.destacada, r.datos.mostrar_direccion]).toEqual([true, true]);
  });

  it("devuelve lo ingresado y todos los errores por campo", () => {
    const r = leer({ precio: "", dormitorios: "-1", sector: "Cavancha" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.errores).sort()).toEqual(["dormitorios", "precio"]);
    expect(r.valores).toMatchObject({ titulo: "Casa en Cavancha", sector: "Cavancha", dormitorios: "-1" });
  });

  it("textos vacíos opcionales quedan en null y se recortan", () => {
    const r = leer({ codigo: "  GC-12 ", sector: "   " });
    expect(r.ok && [r.datos.codigo, r.datos.sector]).toEqual(["GC-12", null]);
  });
});
