import { createBrowserClient } from "@supabase/ssr";

// Cliente para Client Components. Usa solo la clave publishable: los permisos los da RLS.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
