# Proposal

## Why

El panel está completo (specs 0–4) y la corredora ya carga propiedades con fotos, pero el público
todavía ve "Sitio en construcción". Esta spec publica el sitio: inicio según el mockup, listado y ficha
de cada propiedad con contacto por WhatsApp, y las páginas Servicios, Nosotros y Contacto. Con ella, más
el lanzamiento (spec 9), el sitio ya es usable (plan §5:
`1stDocs/001-planificacion/003-corredores/000-plan-portal-propiedades.md`).

## What Changes

- **Inicio** (`/`) según el mockup: encabezado con menú y botón "Escríbenos", hero con el lema y "Ver
  propiedades", hasta 3 propiedades destacadas, "¿Por qué elegir GyCmar?" con 4 valores, "Sobre
  nosotros", franja "¿Hablamos?" con WhatsApp y pie con datos de contacto. Reemplaza la página
  provisional.
- **Listado** (`/propiedades`): todas las propiedades visibles en tarjetas; las disponibles primero
  (destacadas arriba) y las vendidas y arrendadas al final, con su etiqueta.
- **Ficha** (`/propiedades/[slug]`): galería deslizable, precio, características, descripción,
  ubicación (dirección solo si la corredora lo permite) y botón de WhatsApp con mensaje prellenado. Las
  vendidas y arrendadas se muestran con su etiqueta y sin el botón destacado. Un borrador o un slug que
  no existe muestra "no encontrada".
- **Servicios, Nosotros y Contacto** con textos **provisorios** en un solo archivo
  (`src/contenido/sitio.ts`) para que el cliente los reemplace.
- **Datos de contacto por variables de entorno**: WhatsApp (ya existe), correo e Instagram; lo que no
  esté configurado no se muestra.
- **Caché del catálogo**: las páginas públicas leen con `"use cache"` + `cacheTag("propiedades")`; el
  panel ya llama a `updateTag` en cada cambio. Vida máxima de la caché de 5 minutos como respaldo.
- **Imágenes** con `next/image` (en Netlify, su CDN de imágenes: WebP y tamaños según pantalla).
- **Enlace "Ver en el sitio"** desde la página de cada propiedad en el panel.
- Pruebas Playwright del sitio público, incluida la actualización tras un cambio en el panel.

Fuera de esta spec: buscador del hero y filtros (spec 6), metadatos para compartir, sitemap y JSON-LD
(spec 7), mapa (spec 8), favoritos (fuera de la v1).

## Capabilities

### New Capabilities
- `public-site`: qué ve el público en el inicio, el listado, la ficha y las páginas de contenido, cómo
  contacta, y que el sitio refleje los cambios del panel.

### Modified Capabilities
- `brand-shell`: la página de inicio deja de ser "Sitio en construcción" y pasa a ser el inicio del
  sitio público con la marca.

## Impact

- **Archivos nuevos**: grupo de rutas `src/app/(sitio)/` (layout público, inicio, listado, ficha,
  Servicios, Nosotros, Contacto, no encontrada), `src/lib/propiedades/publico.ts` (lecturas cacheadas
  sin sesión), `src/contenido/sitio.ts`, componentes de tarjeta, galería y WhatsApp, `e2e/sitio.spec.ts`.
- **Archivos modificados**: `src/app/page.tsx` (se elimina; el inicio pasa al grupo), `next.config.ts`
  (`images.remotePatterns`), `.env.example` (correo, Instagram, URL del sitio), CI (el `build` pasa al job
  `rls`, ver design), README, página de la propiedad en el panel (enlace al sitio).
- **Netlify**: variables nuevas opcionales (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACTO_EMAIL`,
  `NEXT_PUBLIC_INSTAGRAM`); confirmar `NEXT_PUBLIC_WHATSAPP`.
- **Base de datos**: sin migraciones.
- **Contenido pendiente del cliente**: foto del hero y de "Sobre nosotros", textos de Servicios, valores
  y Nosotros, número de WhatsApp, Instagram y correo. Mientras, marcador visual y textos provisorios.
