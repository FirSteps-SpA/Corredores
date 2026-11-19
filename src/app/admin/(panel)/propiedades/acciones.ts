"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/auth";
import { leerPropiedad, type Errores, type Valores } from "@/lib/propiedades/esquema";
import { ESTADOS, type Estado } from "@/lib/propiedades/opciones";
import { slugLibre } from "@/lib/propiedades/slug";
import { createClient } from "@/lib/supabase/server";

// Etiqueta de caché del catálogo: el sitio público (spec 5) la usa con cacheTag("propiedades").
const CATALOGO = "propiedades";

export type EstadoFormulario = { valores: Valores; errores?: Errores; error?: string };

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Primer slug libre a partir de `base`, sin contar la propiedad que se está editando.
async function slugDisponible(supabase: Supabase, base: string, id: string | null) {
  let consulta = supabase.from("propiedades").select("slug").like("slug", `${base}%`);
  if (id) consulta = consulta.neq("id", id);
  const { data, error } = await consulta;
  if (error) throw new Error(`buscar slugs: ${error.message}`);
  return slugLibre(base, data.map((p) => p.slug));
}

export async function guardarPropiedad(previo: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  await exigirAdmin();
  const id = String(form.get("id") ?? "") || null;
  const r = leerPropiedad(form);
  if (!r.ok) return { valores: r.valores, errores: r.errores };

  const supabase = await createClient();
  // Dos intentos: si otro guardado tomó el mismo slug entre la búsqueda y la escritura,
  // el unique responde 23505 y se busca el siguiente libre.
  for (let intento = 0; intento < 2; intento++) {
    const slug = await slugDisponible(supabase, r.datos.slug, id);
    const datos = { ...r.datos, slug };
    const { data, error } = id
      ? await supabase.from("propiedades").update(datos).eq("id", id).select("id").single()
      : await supabase.from("propiedades").insert(datos).select("id").single();

    if (!error) {
      updateTag(CATALOGO);
      // Al crear, a la página de la propiedad para agregar fotos; al editar, al listado.
      redirect(id ? `/admin?guardada=${encodeURIComponent(slug)}` : `/admin/propiedades/${data.id}?creada=1`);
    }
    if (error.code === "23505" && error.message.includes("slug")) continue;
    if (error.code === "23505" && error.message.includes("codigo"))
      return { valores: r.valores, errores: { codigo: "Ese código ya lo usa otra propiedad." } };
    if (error.code === "PGRST116") return { valores: r.valores, error: "La propiedad ya no existe." };
    console.error("guardar propiedad", error);
    return { valores: r.valores, error: "No se pudo guardar. Inténtalo de nuevo." };
  }
  return { valores: r.valores, error: "No se pudo guardar. Inténtalo de nuevo." };
}

export async function cambiarEstado(form: FormData) {
  await exigirAdmin();
  const estado = String(form.get("estado"));
  if (!(estado in ESTADOS)) throw new Error(`estado inválido: ${estado}`);
  const supabase = await createClient();
  const { error } = await supabase
    .from("propiedades")
    .update({ estado: estado as Estado })
    .eq("id", String(form.get("id")));
  if (error) throw new Error(`cambiar estado: ${error.message}`);
  updateTag(CATALOGO);
  refresh();
}

export async function alternarDestacada(form: FormData) {
  await exigirAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("propiedades")
    .update({ destacada: form.get("destacada") === "true" })
    .eq("id", String(form.get("id")));
  if (error) throw new Error(`destacar: ${error.message}`);
  updateTag(CATALOGO);
  refresh();
}

// Borra primero los archivos de fotos (<id>/… en el bucket) y después la fila; las filas de
// propiedad_fotos caen por cascade. Si fallan los archivos no se borra la fila: se puede reintentar.
export async function eliminarPropiedad(_previo: { error?: string }, form: FormData): Promise<{ error?: string }> {
  await exigirAdmin();
  const id = String(form.get("id"));
  const supabase = await createClient();
  const fotos = supabase.storage.from("propiedades");

  const { data: archivos, error: errorLista } = await fotos.list(id, { limit: 1000 });
  if (errorLista) return { error: "No se pudieron borrar las fotos. Inténtalo de nuevo." };
  if (archivos.length) {
    const { error } = await fotos.remove(archivos.map((a) => `${id}/${a.name}`));
    if (error) return { error: "No se pudieron borrar las fotos. Inténtalo de nuevo." };
  }

  const { error } = await supabase.from("propiedades").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar. Inténtalo de nuevo." };
  updateTag(CATALOGO);
  refresh();
  return {};
}
