import type { Estado } from "./opciones";

// Orden del catálogo público: disponibles (publicada, reservada) antes que cerradas (vendida,
// arrendada); entre las disponibles, destacadas primero; después la última modificada primero.
type Ordenable = { estado: string; destacada: boolean; updated_at: string };

const DISPONIBLES: string[] = ["publicada", "reservada"] satisfies Estado[];

export const disponible = (p: { estado: string }) => DISPONIBLES.includes(p.estado);

export function ordenPublico<T extends Ordenable>(propiedades: T[]): T[] {
  return propiedades.toSorted(
    (a, b) =>
      Number(disponible(b)) - Number(disponible(a)) ||
      (disponible(a) ? Number(b.destacada) - Number(a.destacada) : 0) ||
      b.updated_at.localeCompare(a.updated_at),
  );
}
