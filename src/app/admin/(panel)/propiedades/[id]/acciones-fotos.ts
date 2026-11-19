"use server";

import { updateTag } from "next/cache";
import { exigirAdmin } from "@/lib/auth";
import { listarFotos, type Foto } from "@/lib/propiedades/consultas";
import { BUCKET, MAXIMO_FOTOS, esRutaDe } from "@/lib/fotos/rutas";
import { createClient } from "@/lib/supabase/server";

// Acciones de la galería de una propiedad. El archivo lo sube el navegador directo a Storage
// (RLS: solo el admin escribe en el bucket); aquí se registra, ordena y borra.
// Todas devuelven la galería resultante para que el cliente se sincronice.

export type ResultadoFotos = { fotos: Foto[]; error?: string };

const CATALOGO = "propiedades";

export async function registrarFoto(propiedadId: string, path: string): Promise<ResultadoFotos> {
  await exigirAdmin();
  if (!esRutaDe(path, propiedadId)) throw new Error("ruta de foto inválida");
  const supabase = await createClient();

  const fotos = await listarFotos(propiedadId);
  if (fotos.length >= MAXIMO_FOTOS) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { fotos, error: `Una propiedad puede tener hasta ${MAXIMO_FOTOS} fotos.` };
  }

  // El archivo tiene que existir: el navegador lo subió antes de llamar a esta acción.
  const nombre = path.slice(propiedadId.length + 1);
  const { data: archivos } = await supabase.storage.from(BUCKET).list(propiedadId, { search: nombre });
  if (!archivos?.some((a) => a.name === nombre)) return { fotos, error: "La foto no llegó al almacenamiento." };

  const orden = fotos.length ? Math.max(...fotos.map((f) => f.orden)) + 1 : 0;
  const { error } = await supabase.from("propiedad_fotos").insert({ propiedad_id: propiedadId, path, orden });
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { fotos, error: "No se pudo registrar la foto." };
  }
  updateTag(CATALOGO);
  return { fotos: await listarFotos(propiedadId) };
}

// Borra un archivo subido que no se pudo registrar (lo llama el cliente si falla registrarFoto).
export async function descartarArchivo(propiedadId: string, path: string) {
  await exigirAdmin();
  if (!esRutaDe(path, propiedadId)) throw new Error("ruta de foto inválida");
  const supabase = await createClient();
  await supabase.storage.from(BUCKET).remove([path]);
}

// `ids`: todas las fotos de la propiedad en el orden nuevo. La primera es la portada.
export async function ordenarFotos(propiedadId: string, ids: string[]): Promise<ResultadoFotos> {
  await exigirAdmin();
  const fotos = await listarFotos(propiedadId);
  const actuales = new Set(fotos.map((f) => f.id));
  if (ids.length !== actuales.size || !ids.every((id) => actuales.has(id)))
    return { fotos, error: "La galería cambió. Recarga la página." };

  const supabase = await createClient();
  const resultados = await Promise.all(
    ids.map((id, orden) => supabase.from("propiedad_fotos").update({ orden }).eq("id", id)),
  );
  const fallo = resultados.find((r) => r.error);
  updateTag(CATALOGO);
  return { fotos: await listarFotos(propiedadId), ...(fallo && { error: "No se pudo guardar el orden." }) };
}

// Borra el archivo y después la fila (no dejar filas sin archivo), y renumera las que quedan.
export async function eliminarFoto(propiedadId: string, fotoId: string): Promise<ResultadoFotos> {
  await exigirAdmin();
  const fotos = await listarFotos(propiedadId);
  const foto = fotos.find((f) => f.id === fotoId);
  if (!foto) return { fotos, error: "La foto ya no existe." };

  const supabase = await createClient();
  const { error: errorArchivo } = await supabase.storage.from(BUCKET).remove([foto.path]);
  if (errorArchivo) return { fotos, error: "No se pudo borrar la foto. Inténtalo de nuevo." };
  const { error } = await supabase.from("propiedad_fotos").delete().eq("id", fotoId);
  if (error) return { fotos, error: "No se pudo borrar la foto. Inténtalo de nuevo." };

  const restantes = fotos.filter((f) => f.id !== fotoId);
  await Promise.all(
    restantes.map((f, orden) =>
      f.orden === orden ? null : supabase.from("propiedad_fotos").update({ orden }).eq("id", f.id),
    ),
  );
  updateTag(CATALOGO);
  return { fotos: await listarFotos(propiedadId) };
}
