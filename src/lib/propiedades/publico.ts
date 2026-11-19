import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import type { Database } from "@/lib/supabase/database.types";
import { disponible, ordenPublico } from "./orden";

// Lecturas del sitio público: sin sesión (RLS entrega solo lo que no es borrador) y cacheadas.
// El panel invalida la etiqueta "propiedades" con updateTag en cada cambio; el perfil "catalogo"
// (next.config.ts) las renueva igual cada 5 minutos por si la invalidación fallara.
// Si Supabase responde error, se lanza: no se cachea un catálogo vacío por un error.

// fetch sin la caché de datos de Next: dentro de "use cache" Next también cachea cada fetch, en
// .next/cache/fetch-cache (persiste entre builds) y sin la etiqueta "propiedades", así que
// updateTag no la limpiaría. La única caché del catálogo es la de estas funciones.
const sinCache: typeof fetch = (input, init) => fetch(input, { ...init, cache: "no-store" });

const anonimo = () =>
  createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: sinCache },
  });

type Fila = Database["public"]["Tables"]["propiedades"]["Row"];
export type FotoPublica = { path: string; orden: number };
export type PropiedadPublica = Fila & { fotos: FotoPublica[] };
export type Tarjeta = Pick<
  Fila,
  "id" | "slug" | "titulo" | "operacion" | "tipo" | "precio" | "moneda" | "estado" | "destacada" | "updated_at" |
  "dormitorios" | "banos" | "m2_utiles" | "m2_totales" | "comuna" | "sector"
> & { portada: string | null };

const CAMPOS_TARJETA =
  "id, slug, titulo, operacion, tipo, precio, moneda, estado, destacada, updated_at, dormitorios, banos, m2_utiles, m2_totales, comuna, sector, propiedad_fotos(path, orden)";

function etiquetar() {
  cacheTag("propiedades");
  cacheLife("catalogo");
}

export async function listadoPublico(): Promise<Tarjeta[]> {
  "use cache";
  etiquetar();
  const { data, error } = await anonimo().from("propiedades").select(CAMPOS_TARJETA);
  if (error) throw new Error(`listado público: ${error.message}`);
  const tarjetas = data.map(({ propiedad_fotos, ...p }) => ({
    ...p,
    portada: propiedad_fotos.toSorted((a, b) => a.orden - b.orden)[0]?.path ?? null,
  }));
  return ordenPublico(tarjetas);
}

export async function destacadasInicio(): Promise<Tarjeta[]> {
  "use cache";
  etiquetar();
  return (await listadoPublico()).filter(disponible).slice(0, 3);
}

export async function fichaPublica(slug: string): Promise<PropiedadPublica | null> {
  "use cache";
  etiquetar();
  const { data, error } = await anonimo()
    .from("propiedades")
    .select("*, propiedad_fotos(path, orden)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`ficha pública: ${error.message}`);
  if (!data) return null;
  const { propiedad_fotos, ...p } = data;
  return { ...p, fotos: propiedad_fotos.toSorted((a, b) => a.orden - b.orden) };
}

export async function slugsPublicos(): Promise<string[]> {
  "use cache";
  etiquetar();
  const { data, error } = await anonimo().from("propiedades").select("slug");
  if (error) throw new Error(`slugs públicos: ${error.message}`);
  return data.map((p) => p.slug);
}
