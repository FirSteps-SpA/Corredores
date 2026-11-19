import { cacheLife, cacheTag } from "next/cache";
import { elegirUF, valorDeSerie } from "./leer";

// Valor de la UF del día desde findic.cl (sin clave, servicio de terceros). Cacheado con el perfil
// "uf" de next.config.ts: se renueva una vez al día y, si la renovación falla, Next sigue sirviendo
// el último valor bueno hasta 7 días. fetch con no-store: la única caché es esta (ver spec 5).
async function valorUF(): Promise<number> {
  "use cache";
  cacheTag("uf");
  cacheLife("uf");
  const res = await fetch("https://findic.cl/api/uf", { cache: "no-store", signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`findic.cl respondió ${res.status}`);
  return valorDeSerie(await res.json());
}

// UF_FUENTE=ninguna desactiva la consulta (CI y pruebas); UF_RESPALDO es el valor si no hay otro.
export function obtenerUF(): Promise<number | null> {
  const fuente = process.env.UF_FUENTE === "ninguna" ? null : valorUF;
  return elegirUF(fuente, process.env.UF_RESPALDO, (e) => console.warn("UF no disponible, se usa el respaldo:", e));
}
