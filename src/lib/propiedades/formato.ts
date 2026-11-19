import type { Moneda } from "./opciones";

const uf = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 });
const pesos = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

// "UF 4.500,5" / "$ 350.000"
export function precioTexto(precio: number, moneda: Moneda): string {
  return moneda === "UF" ? `UF ${uf.format(precio)}` : `$ ${pesos.format(precio)}`;
}

// Número para mostrar en un campo del formulario, en formato chileno sin separador de miles
// ("4500,5"), que el esquema vuelve a leer igual.
export function numeroCampo(n: number | null | undefined): string {
  return n === null || n === undefined ? "" : String(n).replace(".", ",");
}
