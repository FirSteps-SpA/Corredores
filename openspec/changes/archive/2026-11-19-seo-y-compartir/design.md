# Design

## Context

- `NEXT_PUBLIC_SITE_URL` ya existe (`SITIO_URL` en `src/lib/contacto.ts`, por defecto
  `https://gycmar.netlify.app`).
- Ficha con `generateMetadata` (título y descripción), `ensureStatic = "navigation"` y datos con
  `"use cache"`; "no encontrada" ya responde 404 con `noindex` (spec 5).
- Fotos en Storage de Supabase (JPEG 1600 px, 150–400 KB). `next/image` en Netlify pasa por su CDN de
  imágenes (`/_next/image?url=…&w=…&q=…`).
- WhatsApp muestra la imagen de la vista previa solo si es liviana (en la práctica, menos de ~300 KB) y
  con URL absoluta; Facebook/Instagram recomiendan 1200 × 630.
- Listado (`/propiedades`) se genera en cada visita por los filtros (spec 6).

## Goals / Non-Goals

**Goals:** vista previa con foto en WhatsApp y redes; sitemap, robots, JSON-LD y canónicas correctos.

**Non-Goals:**
- Imagen de vista previa compuesta (foto + título + precio dibujados con `ImageResponse`): más riesgo en
  Netlify (otra ruta dinámica con `cacheComponents`) por poca ganancia; la vista previa ya muestra
  título y precio en el texto.
- Registro en Google Search Console y Bing (se hace con el dominio propio, spec 9).
- Páginas de listado por comuna o tipo para posicionamiento.

## Decisions

1. **`metadataBase = new URL(SITIO_URL)`** en el layout raíz, con `openGraph` por defecto (`siteName`,
   `locale: "es_CL"`, `type: "website"`, imagen de marca) y `twitter: { card: "summary_large_image" }`.
   Las páginas heredan y sobrescriben título, descripción, imagen y `alternates.canonical`.
2. **Imagen de marca** `public/compartir.jpg` (1200 × 630): logo horizontal oscuro sobre el fondo marino
   con las líneas doradas (como el hero). Se genera una vez con Playwright desde un HTML con los SVG de
   `public/brand/` y se versiona; peso objetivo < 150 KB.
3. **Imagen de la ficha**: URL absoluta del optimizador, `${SITIO_URL}/_next/image?url=<URL pública de la
   portada>&w=1200&q=75`, con `width: 1200`. La calidad tiene que estar en `images.qualities` (por
   defecto solo 75): con `q=70` el optimizador respondía 400 a la URL armada a mano (lo detectó el test). Mismo origen que el sitio, ancho controlado y JPEG/WebP según
   lo que acepte quien la pide (los rastreadores sin `Accept: image/webp` reciben JPEG). Alternativa
   descartada: la URL directa de Supabase (1600 px, puede pasar de 300 KB y es otro dominio).
4. **Descripción** compartida entre metadatos y JSON-LD en `src/lib/seo.ts`: `descripcionFicha(p)` →
   "Venta de casa en Cavancha, Iquique. UF 5.200." (sector y comuna si existen, nunca la dirección).
5. **`src/app/sitemap.ts`**: rutas fijas + `listadoPublico()` (cacheado, etiqueta `propiedades`: se
   invalida con el panel). `lastModified` = `updated_at`; sin `priority`/`changefreq` (Google los
   ignora). **`src/app/robots.ts`**: `allow: "/"`, `disallow: "/admin"`, `sitemap`.
6. **JSON-LD** con un componente `<script type="application/ld+json">` (contenido serializado con
   `JSON.stringify` y `<` escapado para no cerrar el script):
   - Inicio: `RealEstateAgent` con `name`, `url`, `logo`, `image`, `address` (Iquique, CL), `telephone`
     y `sameAs` (Instagram) solo si están configurados.
   - Ficha: `RealEstateListing` con `name`, `description`, `url`, `image` (todas las fotos), `datePosted`
     (`created_at`), y `offers` (`Offer`: `price`, `priceCurrency` `CLF`/`CLP`, `availability`
     `InStock` si está disponible, `SoldOut` si vendida o arrendada), y `about` → `Accommodation`
     (`numberOfRooms`, `numberOfBathroomsTotal`, `floorSize` en m², `address` con `addressLocality`,
     `addressRegion`, y `streetAddress` solo si `mostrar_direccion`).
7. **Canónicas**: cada página declara `alternates.canonical` con su ruta; el listado declara
   `/propiedades` aunque traiga parámetros (sus metadatos no leen `searchParams`).
8. **Pruebas Playwright `e2e/seo.spec.ts`**: `og:title`, `og:description`, `og:image` absoluta en la ficha
   (la imagen responde 200, es imagen y pesa < 300 KB), imagen de marca en una ficha sin fotos y en el
   inicio, JSON-LD parseable con precio/moneda y sin dirección oculta, `sitemap.xml` con fichas visibles
   y sin borradores (incluida una publicada después del build vía panel), `robots.txt`, canónica del
   listado con filtros. En CI `NEXT_PUBLIC_SITE_URL=http://localhost:3000`, así las URL absolutas
   apuntan a la app de prueba.

## Risks / Trade-offs

- [WhatsApp guarda en caché la vista previa de un enlace] → un enlace compartido antes de esta spec
  puede seguir sin foto un tiempo; los nuevos se ven bien. Para probar se puede agregar `?v=1` al enlace.
- [Netlify CDN de imágenes con la URL de Supabase] → ya funciona en el sitio (spec 5).
- [`metadataBase` con el dominio de Netlify] → al pasar al dominio propio basta cambiar
  `NEXT_PUBLIC_SITE_URL` y redeplegar (spec 9).

## Migration Plan

Sin migraciones. PR → `develop`, release a `main`. Verificar en producción con un enlace real en
WhatsApp y con el depurador de Facebook (Sharing Debugger).
