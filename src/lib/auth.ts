import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Sesion = { email: string; esAdmin: boolean } | null;

// Sesión del request actual, verificada en el servidor (una vez por request gracias a cache).
// Es la comprobación que vale para el panel: el proxy solo redirige de forma optimista.
export const obtenerSesion = cache(async (): Promise<Sesion> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;

  const { data: esAdmin } = await supabase.rpc("es_admin");
  return { email: String(data.claims.email ?? ""), esAdmin: esAdmin === true };
});

// Guardia de cada página y server action del panel: sin sesión → login; sin ser admin →
// /admin/sin-acceso. No basta con el layout: Next serializa la página aunque el layout no
// la muestre, y una server action se puede invocar sin pasar por ninguna página.
export async function exigirAdmin() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/admin/login");
  if (!sesion.esAdmin) redirect("/admin/sin-acceso");
  return sesion;
}

// Destino tras el login: solo rutas del panel, nunca otro sitio ni el propio login.
export function destinoSeguro(next: unknown): string {
  if (typeof next !== "string") return "/admin";
  const ruta = next.split(/[?#]/)[0];
  const valida =
    (ruta === "/admin" || ruta.startsWith("/admin/")) &&
    !next.startsWith("//") &&
    !next.includes("\\") &&
    ruta !== "/admin/login";
  return valida ? next : "/admin";
}
