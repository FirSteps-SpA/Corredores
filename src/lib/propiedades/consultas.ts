import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { Estado } from "./opciones";
import { normalizar } from "./slug";

export type Propiedad = Database["public"]["Tables"]["propiedades"]["Row"];
export type Foto = Pick<Database["public"]["Tables"]["propiedad_fotos"]["Row"], "id" | "path" | "orden">;

// Lecturas del panel con la sesión de la corredora (RLS: el admin ve también los borradores).
// Quien llama ya pasó por exigirAdmin().

export async function listarPropiedades({ estado, q }: { estado?: Estado; q?: string }) {
  const supabase = await createClient();
  let consulta = supabase
    .from("propiedades")
    .select("*, propiedad_fotos(path, orden)")
    .order("updated_at", { ascending: false });
  if (estado) consulta = consulta.eq("estado", estado);
  const { data, error } = await consulta;
  if (error) throw new Error(`listar propiedades: ${error.message}`);

  // Portada: la foto de menor orden.
  const propiedades = data.map(({ propiedad_fotos, ...p }) => ({
    ...p,
    portada: propiedad_fotos.toSorted((a, b) => a.orden - b.orden)[0]?.path ?? null,
  }));

  // Búsqueda sin tildes ni mayúsculas en memoria: el catálogo es de decenas de propiedades.
  const busqueda = normalizar(q?.trim() ?? "");
  if (!busqueda) return propiedades;
  return propiedades.filter((p) => normalizar(`${p.titulo} ${p.codigo ?? ""}`).includes(busqueda));
}

export async function obtenerPropiedad(id: string): Promise<Propiedad | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("propiedades").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`obtener propiedad: ${error.message}`);
  return data;
}

export async function listarFotos(propiedadId: string): Promise<Foto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("propiedad_fotos")
    .select("id, path, orden")
    .eq("propiedad_id", propiedadId)
    .order("orden")
    .order("id");
  if (error) throw new Error(`listar fotos: ${error.message}`);
  return data;
}
