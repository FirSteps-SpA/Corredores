// Rutas y URLs de las fotos en el bucket `propiedades`: <propiedad_id>/<uuid>.jpg

export const BUCKET = "propiedades";
export const MAXIMO_FOTOS = 30;
export const TIPOS_ACEPTADOS = ["image/jpeg", "image/png", "image/webp"];

export function rutaNueva(propiedadId: string): string {
  return `${propiedadId}/${crypto.randomUUID()}.jpg`;
}

// Una ruta es de la propiedad si está directamente bajo su carpeta (sin subcarpetas ni "..").
export function esRutaDe(path: string, propiedadId: string): boolean {
  return new RegExp(`^${propiedadId}/[A-Za-z0-9-]+\\.(jpg|jpeg|png|webp)$`).test(path);
}

export function urlPublica(path: string, base = process.env.NEXT_PUBLIC_SUPABASE_URL): string {
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}
