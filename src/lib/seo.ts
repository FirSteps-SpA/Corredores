// Metadatos para compartir y datos estructurados (spec 7). Funciones puras: las URL absolutas se
// arman con SITIO_URL (NEXT_PUBLIC_SITE_URL), así cambian solas con el dominio propio.

import { CIUDAD, NOMBRE } from "@/contenido/sitio";
import { SITIO_URL, instagram } from "@/lib/contacto";
import { urlPublica } from "@/lib/fotos/rutas";
import { precioTexto } from "@/lib/propiedades/formato";
import { OPERACIONES, TIPOS, type Moneda, type Operacion, type Tipo } from "@/lib/propiedades/opciones";
import { disponible } from "@/lib/propiedades/orden";

export const IMAGEN_MARCA = { url: "/compartir.jpg", width: 1200, height: 630, alt: NOMBRE };
export const DESCRIPCION_SITIO =
  "Corredora de propiedades en Iquique: compra, venta y arriendo de casas y departamentos.";

type FichaSeo = {
  slug: string;
  titulo: string;
  descripcion: string | null;
  operacion: string;
  tipo: string;
  precio: number;
  moneda: string;
  sector: string | null;
  comuna: string;
  region: string | null;
  direccion: string | null;
  mostrar_direccion: boolean;
  lat: number | null;
  lng: number | null;
  dormitorios: number | null;
  banos: number | null;
  m2_utiles: number | null;
  m2_totales: number | null;
  estado: string;
  created_at: string;
  fotos: { path: string }[];
};

// "Venta de casa en Cavancha, Iquique. UF 5.200." (nunca la dirección exacta).
export function descripcionFicha(p: Pick<FichaSeo, "operacion" | "tipo" | "sector" | "comuna" | "precio" | "moneda">) {
  const lugar = [p.sector, p.comuna].filter(Boolean).join(", ");
  const tipo = TIPOS[p.tipo as Tipo]?.toLowerCase() ?? p.tipo;
  return `${OPERACIONES[p.operacion as Operacion]} de ${tipo} en ${lugar}. ${precioTexto(p.precio, p.moneda as Moneda)}.`;
}

// Imagen para la vista previa: la portada reducida a 1200 px por el optimizador del sitio (WhatsApp
// descarta imágenes pesadas) o, sin fotos, la imagen de marca. Ancho y calidad deben estar permitidos
// por next/image (deviceSizes y qualities, por defecto [75]): otro valor en una URL armada a mano
// responde 400, y WhatsApp mostraría la vista previa sin foto.
export function imagenCompartir(portada: string | null, alt: string) {
  if (!portada) return IMAGEN_MARCA;
  const url = `${SITIO_URL}/_next/image?url=${encodeURIComponent(urlPublica(portada))}&w=1200&q=75`;
  return { url, width: 1200, alt };
}

export const urlAbsoluta = (ruta: string) => `${SITIO_URL}${ruta}`;

export function jsonLdCorredora({ telefono }: { telefono?: string | null } = {}) {
  const ig = instagram();
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: NOMBRE,
    url: SITIO_URL,
    logo: urlAbsoluta("/brand/gycmar-logo.svg"),
    image: urlAbsoluta(IMAGEN_MARCA.url),
    description: DESCRIPCION_SITIO,
    address: { "@type": "PostalAddress", addressLocality: CIUDAD.split(",")[0], addressCountry: "CL" },
    ...(telefono && { telephone: `+${telefono.replace(/\D/g, "")}` }),
    ...(ig && { sameAs: [ig.url] }),
  };
}

export function jsonLdFicha(p: FichaSeo) {
  const url = urlAbsoluta(`/propiedades/${p.slug}`);
  const superficie = p.m2_utiles ?? p.m2_totales;
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.titulo,
    description: p.descripcion || descripcionFicha(p),
    url,
    datePosted: p.created_at,
    image: p.fotos.map((f) => urlPublica(f.path)),
    offers: {
      "@type": "Offer",
      price: p.precio,
      // ISO 4217: la UF es CLF.
      priceCurrency: p.moneda === "UF" ? "CLF" : "CLP",
      availability: disponible(p) ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      businessFunction: p.operacion === "arriendo" ? "https://purl.org/goodrelations/v1#LeaseOut" : "https://purl.org/goodrelations/v1#Sell",
      url,
    },
    about: {
      "@type": "Accommodation",
      ...(p.dormitorios !== null && { numberOfRooms: p.dormitorios }),
      ...(p.banos !== null && { numberOfBathroomsTotal: p.banos }),
      ...(superficie !== null && { floorSize: { "@type": "QuantitativeValue", value: superficie, unitCode: "MTK" } }),
      // Coordenadas solo si la ubicación exacta es pública (spec 8).
      ...(p.mostrar_direccion && p.lat !== null && p.lng !== null && { geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng } }),
      address: {
        "@type": "PostalAddress",
        ...(p.mostrar_direccion && p.direccion && { streetAddress: p.direccion }),
        addressLocality: p.comuna,
        ...(p.region && { addressRegion: p.region }),
        addressCountry: "CL",
      },
    },
  };
}

// Contenido para <script type="application/ld+json">: "<" escapado para que un texto no cierre el script.
export const jsonLdTexto = (datos: object) => JSON.stringify(datos).replace(/</g, "\\u003c");
