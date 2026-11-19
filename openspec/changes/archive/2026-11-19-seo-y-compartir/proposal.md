# Proposal

## Why

La corredora comparte sus propiedades sobre todo por WhatsApp e Instagram, y hoy un enlace a una ficha
se ve sin foto ni precio: pierde la mitad de su atractivo. Además, los buscadores no tienen un mapa del
sitio ni datos estructurados para entender que son propiedades en venta o arriendo en Iquique. Es la
spec 7 del plan (`1stDocs/001-planificacion/003-corredores/000-plan-portal-propiedades.md`, §4 y §5).

## What Changes

- **Vista previa al compartir** (Open Graph y Twitter/X): cada ficha con su portada, título y una
  descripción con operación, tipo, sector y precio; las demás páginas con una imagen de marca.
- **Imagen de marca para compartir** (1200 × 630) en `public/`, para el inicio y las páginas sin foto.
- **`sitemap.xml`** dinámico con las páginas del sitio y todas las fichas visibles (fecha de última
  modificación), actualizado con la caché del catálogo.
- **`robots.txt`** que permite el sitio, excluye `/admin` y apunta al sitemap.
- **Datos estructurados (JSON-LD)**: la corredora como `RealEstateAgent` en el inicio y cada ficha como
  `RealEstateListing` con su oferta (precio y moneda, con la UF como `CLF`), fotos y ubicación.
- **URL canónica** en cada página; el listado con filtros apunta al listado sin filtros.
- `metadataBase` desde `NEXT_PUBLIC_SITE_URL`, para que todas las URL sean absolutas y cambien solas con
  el dominio propio (spec 9).

## Capabilities

### New Capabilities
- `seo-sharing`: cómo se ven las páginas al compartirlas y qué información reciben los buscadores
  (sitemap, robots, datos estructurados, URL canónica).

### Modified Capabilities
<!-- Ninguna: `public-site` ya define título y "no encontrada" con noindex; esta spec agrega metadatos
     sin cambiar lo que se muestra. -->

## Impact

- **Archivos nuevos**: `src/app/sitemap.ts`, `src/app/robots.ts`, `src/lib/seo.ts` (descripciones,
  JSON-LD, URL de imagen), `public/compartir.jpg`, `e2e/seo.spec.ts`.
- **Archivos modificados**: `src/app/layout.tsx` (`metadataBase`, Open Graph por defecto), ficha
  (`generateMetadata` con imagen, JSON-LD), inicio (JSON-LD de la corredora), listado (canónica), README.
- **Sin impacto en**: base de datos, panel.
