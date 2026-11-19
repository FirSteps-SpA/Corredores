import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

// Refresca la sesión de Supabase en el proxy y devuelve la respuesta con las cookies
// actualizadas. Patrón oficial de @supabase/ssr: las cookies nuevas se copian al request
// (para el resto de este request) y a la respuesta (para el navegador).
export async function actualizarSesion(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          respuesta = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            respuesta.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: nada entre createServerClient y getClaims(): getClaims valida el JWT
  // y, si venció, refresca la sesión (lo que escribe las cookies nuevas).
  const { data } = await supabase.auth.getClaims();

  return { respuesta, conSesion: !!data?.claims };
}
