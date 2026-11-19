// Lectura del valor de la UF (spec 6), sin dependencias de Next para probarla con Vitest.

// Respuesta de findic.cl/api/uf: { serie: [{ fecha: "2026-11-19", valor: 41364.17 }, ...] }, la más
// reciente primero. Se valida el rango para no usar un valor absurdo si el formato cambia.
export function valorDeSerie(json: unknown): number {
  const serie = (json as { serie?: { valor?: unknown }[] })?.serie;
  const valor = Array.isArray(serie) ? serie[0]?.valor : undefined;
  if (typeof valor !== "number" || !(valor >= 10_000 && valor <= 200_000)) {
    throw new Error(`respuesta de UF inesperada: ${JSON.stringify(json)?.slice(0, 120)}`);
  }
  return valor;
}

// UF para filtrar y ordenar: la de la fuente o, si falla o está desactivada, la de respaldo
// (variable UF_RESPALDO), o null (entonces el precio se compara solo en la misma moneda).
export async function elegirUF(
  obtener: (() => Promise<number>) | null,
  respaldo: string | undefined,
  avisar: (e: unknown) => void = () => {},
): Promise<number | null> {
  if (obtener) {
    try {
      return await obtener();
    } catch (e) {
      avisar(e);
    }
  }
  const r = Number(respaldo);
  return r >= 10_000 && r <= 200_000 ? r : null;
}
