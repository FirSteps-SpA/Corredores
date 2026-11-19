import type { MetadataRoute } from "next";
import { listadoPublico } from "@/lib/propiedades/publico";
import { urlAbsoluta } from "@/lib/seo";

// Mapa del sitio (spec 7): páginas fijas y fichas visibles. Usa el listado cacheado con la etiqueta
// "propiedades", así se actualiza cuando el panel publica o retira una propiedad.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const propiedades = await listadoPublico();
  const fijas = ["/", "/propiedades", "/servicios", "/nosotros", "/contacto"].map((ruta) => ({ url: urlAbsoluta(ruta) }));
  return [
    ...fijas,
    ...propiedades.map((p) => ({ url: urlAbsoluta(`/propiedades/${p.slug}`), lastModified: p.updated_at })),
  ];
}
