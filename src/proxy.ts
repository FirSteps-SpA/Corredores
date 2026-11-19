import { NextResponse, type NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/proxy";

const LOGIN = "/admin/login";

// Chequeo optimista del panel: refresca la sesión y redirige según haya o no sesión.
// Si la cuenta es admin lo decide el servidor al renderizar (src/lib/auth.ts).
export async function proxy(request: NextRequest) {
  const { respuesta, conSesion } = await actualizarSesion(request);
  const { pathname, search } = request.nextUrl;

  if (!conSesion && pathname !== LOGIN) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN;
    url.search = "";
    url.searchParams.set("next", pathname + search);
    return redirigir(url, respuesta);
  }

  if (conSesion && pathname === LOGIN) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return redirigir(url, respuesta);
  }

  return respuesta;
}

// Una redirección nueva no lleva las cookies que haya escrito el refresco de sesión: se copian.
function redirigir(url: URL, conCookies: NextResponse) {
  const redireccion = NextResponse.redirect(url);
  conCookies.cookies.getAll().forEach((c) => redireccion.cookies.set(c));
  return redireccion;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
