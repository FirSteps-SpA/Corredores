// Compresión en el navegador antes de subir: lado mayor ≤ 1600 px, JPEG calidad 0,8, con la
// orientación EXIF aplicada. JPEG y no WebP: Safari no siempre codifica WebP en canvas.

import { TIPOS_ACEPTADOS } from "./rutas";

export const LADO_MAXIMO = 1600;
const CALIDAD = 0.8;

export class FotoNoValida extends Error {}

export async function comprimir(archivo: File): Promise<Blob> {
  if (!TIPOS_ACEPTADOS.includes(archivo.type)) throw new FotoNoValida("No es una imagen JPEG, PNG ni WebP.");

  let imagen: ImageBitmap;
  try {
    imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  } catch {
    throw new FotoNoValida("No se pudo leer la imagen.");
  }

  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
  const ancho = Math.round(imagen.width * escala);
  const alto = Math.round(imagen.height * escala);
  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d")!;
  // Fondo blanco: un PNG con transparencia quedaría negro en JPEG.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, ancho, alto);
  ctx.drawImage(imagen, 0, 0, ancho, alto);
  imagen.close();

  const jpeg = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", CALIDAD));
  if (!jpeg) throw new FotoNoValida("No se pudo comprimir la imagen.");

  // Si ya era un JPEG de tamaño aceptable y comprimirlo no ayuda, se sube el original.
  if (archivo.type === "image/jpeg" && escala === 1 && archivo.size <= jpeg.size) return archivo;
  return jpeg;
}
