// Constantes de los mapas (spec 8). Teselas de OpenStreetMap: gratis con atribución y bajo volumen;
// si el tráfico crece, cambiar a un proveedor con clave es cambiar estas dos constantes.
export const TESELAS = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const ATRIBUCION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
export const CENTRO_IQUIQUE: [number, number] = [-20.2307, -70.1357];
// Radio del círculo de ubicación aproximada: el punto aproximado está a menos de ~400 m del real.
export const RADIO_APROXIMADO = 500;

// Búsqueda de direcciones (Nominatim, desde el navegador, una por clic).
export async function buscarDireccion(texto: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=cl&q=${encodeURIComponent(texto)}`;
  const res = await fetch(url, { headers: { "Accept-Language": "es" } });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const [r] = (await res.json()) as { lat: string; lon: string }[];
  return r ? { lat: Number(r.lat), lng: Number(r.lon) } : null;
}

// Marcador sin imágenes (los íconos por defecto de Leaflet fallan con los bundlers).
export const HTML_MARCADOR =
  '<span style="display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;background:#04142c;border:3px solid #c89860;transform:rotate(-45deg)"></span>';
