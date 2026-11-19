# Design

## Context

- `next.config.ts`: `cacheComponents: true` y `partialPrefetching: true`. Con eso, lo que lee datos
  dinámicos va en `<Suspense>`, los datos compartidos se cachean con `"use cache"` y una ruta dinámica
  necesita `generateStaticParams` con **al menos un** parámetro (docs de Next 16:
  `generate-static-params.md`, guía `incremental-static-regeneration-cache-components.md`).
- El panel (spec 3 y 4) ya llama a `updateTag("propiedades")` en cada cambio de propiedades y fotos.
- RLS (spec 1): con la clave publishable sin sesión se ven solo las propiedades que no son borrador y
  sus fotos. El sitio público no necesita sesión.
- `src/lib/supabase/server.ts` lee cookies y llama a `connection()`: no sirve dentro de `"use cache"`.
- Mockup y paleta en el plan §1.3; textos y fotos del cliente pendientes.
- Netlify: adaptador `@netlify/plugin-nextjs` 5.16. Netlify anuncia soporte de Next 16, pero **no
  encontramos confirmación explícita** de `"use cache"` + `updateTag` de punta a punta en su adaptador
  (búsqueda del 2026-11-19). Ver riesgos.
- CI: el job `build` construye con una URL de Supabase de relleno y sin base; el job `rls` construye
  contra Supabase local.

## Goals / Non-Goals

**Goals:**
- Sitio público completo y fiel al mockup, rápido (páginas prerenderizadas y caché del catálogo),
  que refleje el panel en la siguiente visita.
- Textos y datos de contacto reemplazables sin tocar componentes.

**Non-Goals:**
- Buscador del hero, filtros y paginación (spec 6): el hero lleva solo "Ver propiedades" hasta entonces.
- Open Graph, sitemap, robots y JSON-LD (spec 7). Esta spec pone `title` y `description` por página.
- Mapa (spec 8), favoritos, formulario de contacto con correo (fuera de la v1).
- Estado 404 real en fichas inexistentes: con `cacheComponents` la ficha se resuelve dentro de
  `<Suspense>` y `notFound()` responde 200 con `noindex` ("soft 404"). Se revisa en la spec 7.

## Decisions

1. **Rutas en el grupo `src/app/(sitio)/`** con su `layout.tsx` (encabezado y pie): `page.tsx` (inicio),
   `propiedades/page.tsx`, `propiedades/[slug]/page.tsx`, `servicios`, `nosotros`, `contacto` y
   `not-found.tsx`. Se borra `src/app/page.tsx`. El panel queda fuera del grupo y no hereda el
   encabezado público.
2. **Lecturas públicas en `src/lib/propiedades/publico.ts`**, con un cliente `supabase-js` **sin
   sesión** (clave publishable, `persistSession: false`): RLS da exactamente lo visible. Cada función
   lleva `"use cache"`, `cacheTag("propiedades")` y `cacheLife({ stale: 60, revalidate: 300, expire:
   3600 })`: `updateTag` del panel las invalida al momento y, si eso fallara en Netlify, se renuevan
   como máximo cada 5 minutos. El cliente usa un `fetch` con `cache: "no-store"`: dentro de
   `"use cache"` Next cacheaba además cada `fetch` en `.next/cache/fetch-cache`, **sin la etiqueta y
   persistente entre builds** (un segundo build reutilizó el catálogo vacío del primero), así que
   `updateTag` no lo habría limpiado. La única caché del catálogo es la de estas funciones. Funciones: `destacadasInicio()`, `listadoPublico()`,
   `fichaPublica(slug)` (propiedad + fotos ordenadas) y `slugsPublicos()`. Si Supabase responde error,
   la función **lanza** (no se cachea un catálogo vacío por un error).
3. **Orden del catálogo** en una función pura `ordenPublico()` (con tests): disponibles (publicada,
   reservada) antes que cerradas (vendida, arrendada); dentro de las disponibles, destacadas primero;
   después por `updated_at` descendente. Inicio: las 3 primeras disponibles de ese orden.
4. **Ficha**: `generateStaticParams` devuelve los slugs visibles o, si no hay ninguno (CI con base
   vacía), `[{ slug: "__sin-propiedades__" }]`, que termina en `notFound()`. `generateMetadata` da
   el título de la propiedad; no agrega `robots`: Next ya marca `noindex` al llamar a `notFound()` y
   duplicarlo dejaba dos etiquetas. La página espera `params`
   dentro de `<Suspense>` (App Shell para slugs nuevos, guía de ISR con Cache Components). Un slug de
   borrador o inexistente: `fichaPublica` devuelve `null` → `notFound()`.
5. **Galería de la ficha**: carrusel con `scroll-snap` de CSS (se desliza con el dedo sin JavaScript)
   y un componente cliente pequeño con flechas, contador "3 / 12" y miniaturas que hacen scroll a la
   foto. Sin librerías. Texto alternativo: `"<título> – foto <n> de <total>"`.
6. **Imágenes con `next/image`** y `images.remotePatterns` armado desde `NEXT_PUBLIC_SUPABASE_URL`
   (ruta `/storage/v1/object/public/propiedades/**`). En Netlify el adaptador sirve `/_next/image` con
   su CDN de imágenes (WebP/AVIF, anchos según `sizes`). En local y CI la URL es `127.0.0.1`, que Next
   bloquea por defecto: `dangerouslyAllowLocalIP` se activa **solo** si la URL de Supabase es local.
   Primera foto de la ficha y portada del hero con `priority`; el resto `lazy`. Alternativa descartada:
   transformación de imágenes de Supabase (tiene costo por imagen sobre lo incluido y en local `imgproxy`
   está apagado, así que local y producción se comportarían distinto).
7. **Contenido en `src/contenido/sitio.ts`**: lema, valores (los del mockup), "Sobre nosotros",
   servicios y textos de Nosotros, cada bloque marcado `// PROVISORIO` donde falta el texto del cliente.
   Basados en el mockup (cambiando "GC" por "GyCmar") en vez de *lorem ipsum*: el sitio es público en
   `gycmar.netlify.app` y un texto de relleno se vería roto. El cliente los revisa antes del lanzamiento
   (spec 9). Fotos del hero y de "Sobre nosotros": `heroImagen`/`nosotrosImagen` en el mismo archivo,
   hoy `null` → fondo de marca (degradado marino con las líneas doradas del isotipo).
8. **Contacto por variables de entorno** en `src/lib/contacto.ts`: `NEXT_PUBLIC_WHATSAPP` (ya existe),
   `NEXT_PUBLIC_CONTACTO_EMAIL`, `NEXT_PUBLIC_INSTAGRAM` y `NEXT_PUBLIC_SITE_URL` (base para el enlace
   del mensaje de WhatsApp; por defecto `https://gycmar.netlify.app`). `enlaceWhatsApp(mensaje?)` arma
   `https://wa.me/<número>?text=<mensaje codificado>` y devuelve `null` sin número; los componentes no
   renderizan nada si es `null`. Función pura `mensajePropiedad({codigo, titulo, url})` con tests.
9. **Menú en celular** con `<details>`/`<summary>` (funciona sin JavaScript, accesible), cerrado al
   navegar con un pequeño componente cliente.
10. **"Ver en el sitio"** en la página de la propiedad del panel: enlace a `/propiedades/<slug>` si no
    es borrador; si es borrador, el texto "Visible en el sitio cuando la publiques".
11. **CI**: el job `build` ya no corre `next build` (necesita la base para prerenderizar el catálogo y
    `generateStaticParams`); queda con lint, typecheck y tests unitarios. El build real ya ocurre en el
    job `rls` contra Supabase local, antes de `test:panel` y Playwright. El nombre de los jobs no cambia
    (la protección de `main` exige `build` y `rls`).
12. **Pruebas**:
    - Vitest: `ordenPublico`, `mensajePropiedad`, `enlaceWhatsApp`.
    - Playwright `e2e/sitio.spec.ts` (con propiedades y fotos preparadas con la clave secreta): inicio
      con destacadas correctas; listado en orden y sin borradores; tarjeta sin fotos; ficha con fotos en
      orden y alt, dirección oculta/visible, enlace de WhatsApp con el mensaje exacto, vendida sin
      botón; borrador e inexistente → "no encontrada" sin datos; contacto con datos parciales (las
      variables de la build de CI); menú en 390 px; imagen de tarjeta servida por `/_next/image` con
      ancho menor a 1600; y **panel → sitio**: publicar y despublicar desde el panel (UI real, para que
      corra `updateTag`) y verlo reflejado en la visita siguiente.
    - `test:panel` sigue verificando que `/` responde sin pasar por el proxy.

## Risks / Trade-offs

- [`updateTag` no se propaga en Netlify] → el `cacheLife` de 5 minutos lo acota; se verifica en
  producción en la tarea 7.2. Si falla, alternativa: leer el catálogo sin caché (consultas chicas a
  Supabase) y dejar la caché solo para las imágenes.
- [CDN de imágenes de Netlify no acepta la URL de Supabase] → se verifica en producción; si falla,
  `images.unoptimized` (las fotos ya vienen comprimidas a 1600 px).
- [Textos provisorios publicados] → basados en el mockup aprobado; revisión del cliente es compuerta
  de la spec 9.
- [Soft 404 en fichas] → `noindex` lo saca de los buscadores; se revisa en la spec 7.
- [El job `build` deja de construir] → el build sigue ocurriendo en `rls` y en Netlify; si el job `rls`
  falla por Supabase, el build tampoco se valida en ese PR.

## Migration Plan

Sin migraciones. PR → `develop` con CI en verde; release a `main`. En Netlify, antes del release:
confirmar `NEXT_PUBLIC_WHATSAPP` y, si el cliente ya los tiene, correo e Instagram. Después del deploy:
revisar inicio, listado y ficha con las propiedades reales, y que publicar/despublicar desde el panel
se refleje.

Rollback: revertir el merge; vuelve la página "en construcción".

## Open Questions

- Número de WhatsApp, Instagram y correo definitivos: son variables de Netlify, no cambian código.
- Fotos del hero y "Sobre nosotros" y textos definitivos: se reemplazan en `src/contenido/sitio.ts`.
