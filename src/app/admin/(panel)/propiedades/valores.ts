import type { Propiedad } from "@/lib/propiedades/consultas";
import type { Valores } from "@/lib/propiedades/esquema";
import { numeroCampo } from "@/lib/propiedades/formato";
import { CARACTERISTICAS, COMUNA_POR_DEFECTO, REGION_POR_DEFECTO } from "@/lib/propiedades/opciones";

// Valores iniciales del formulario.

export const valoresNueva: Valores = {
  estado: "borrador",
  operacion: "venta",
  tipo: "casa",
  moneda: "UF",
  region: REGION_POR_DEFECTO,
  comuna: COMUNA_POR_DEFECTO,
};

export function valoresDe(p: Propiedad): Valores {
  const sugeridas = p.caracteristicas.filter((c) => CARACTERISTICAS.includes(c));
  const otras = p.caracteristicas.filter((c) => !CARACTERISTICAS.includes(c));
  const numeros = ["precio", "gastos_comunes", "dormitorios", "banos", "estacionamientos", "bodegas", "m2_utiles", "m2_totales"] as const;
  const textos = ["titulo", "slug", "codigo", "descripcion", "operacion", "tipo", "moneda", "region", "comuna", "sector", "direccion", "estado"] as const;
  return {
    ...Object.fromEntries(textos.map((c) => [c, p[c] ?? ""])),
    ...Object.fromEntries(numeros.map((c) => [c, numeroCampo(p[c])])),
    lat: p.lat?.toString() ?? "",
    lng: p.lng?.toString() ?? "",
    caracteristicas: sugeridas,
    caracteristicas_otras: otras.join(", "),
    mostrar_direccion: p.mostrar_direccion ? "on" : "",
    destacada: p.destacada ? "on" : "",
  };
}
