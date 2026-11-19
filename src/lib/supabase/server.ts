import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { Database } from "./database.types";

// Cliente para Server Components, Server Actions y Route Handlers, con la sesión de las cookies.
export async function createClient() {
  // Siempre en el request: el cliente usa Date.now() al leer la sesión, lo que Next no admite
  // durante el prerender (cacheComponents), aunque haya cookies disponibles.
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Desde un Server Component no se pueden escribir cookies; el refresco de sesión
            // lo hará proxy.ts cuando exista (spec 2).
          }
        },
      },
    },
  );
}
