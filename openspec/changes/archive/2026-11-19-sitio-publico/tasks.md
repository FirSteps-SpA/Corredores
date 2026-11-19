# Tasks

## 1. Base

- [x] 1.1 `src/lib/contacto.ts` (`enlaceWhatsApp`, `mensajePropiedad`, datos de contacto) y `src/contenido/sitio.ts` (decisiones 7 y 8), con tests de Vitest. Verificar con `npm test`.
- [x] 1.2 `ordenPublico()` con tests y `src/lib/propiedades/publico.ts` (decisiones 2 y 3). Verificar con `npm test` y `npm run typecheck`.
- [x] 1.3 `next.config.ts` con `images.remotePatterns` y `dangerouslyAllowLocalIP` solo con Supabase local (decisión 6); `.env.example` con las variables nuevas. Verificar con `npm run build` contra Supabase local.

## 2. Estructura y páginas

- [x] 2.1 Grupo `(sitio)` con layout (encabezado con menú de celular, botón "Escríbenos", pie) y `not-found.tsx`; borrar `src/app/page.tsx`. Verificar en el navegador en escritorio y 390 px.
- [x] 2.2 Inicio según el mockup (hero con fondo de marca, destacadas, valores, sobre nosotros, "¿Hablamos?"). Verificar en el navegador con propiedades locales y sin propiedades.
- [x] 2.3 Tarjeta de propiedad y listado `/propiedades` (decisión 3). Verificar en el navegador el orden y las etiquetas.
- [x] 2.4 Ficha `/propiedades/[slug]` con `generateStaticParams` (decisión 4), galería (decisión 5), datos, ubicación y WhatsApp. Verificar en el navegador con una propiedad con y sin fotos, vendida y con dirección oculta.
- [x] 2.5 Servicios, Nosotros y Contacto. Verificar en el navegador con y sin las variables de contacto.
- [x] 2.6 "Ver en el sitio" en la página de la propiedad del panel (decisión 10). Verificar en el navegador.

## 3. CI y pruebas

- [x] 3.1 CI: quitar `npm run build` del job `build` (decisión 11). Verificar la sintaxis con `yaml-lint`.
- [x] 3.2 `e2e/sitio.spec.ts` con los casos de la decisión 12. Verificar que pasan contra `next start` y que el de panel → sitio falla si se quita temporalmente `updateTag` de `cambiarEstado` y se sube el `cacheLife` (revertir después).
- [x] 3.3 Verificar que `lint`, `typecheck`, `test`, `test:rls`, `test:panel` y `test:e2e` pasan, y que `grep -r "GC Propiedades" .next/server/app` no encuentra nada.

## 4. Documentación y PR

- [x] 4.1 README: sitio público, `src/contenido/sitio.ts`, variables de contacto, caché del catálogo. Verificar leyendo el README contra el código.
- [x] 4.2 Commit gitmoji y PR de `feat/sitio-publico` a `develop`. Verificar que `build` y `rls` terminan en verde.

## 5. Producción

- [x] 5.1 (Usuario) En Netlify: confirmar `NEXT_PUBLIC_WHATSAPP` y agregar `NEXT_PUBLIC_SITE_URL` (y correo e Instagram si existen). Verificar en la configuración del sitio.
- [x] 5.2 (Con visto bueno explícito) Release a `main`. Verificar en https://gycmar.netlify.app: inicio, listado, ficha con fotos (imágenes por `/_next/image`), WhatsApp con mensaje correcto, y que publicar y despublicar una propiedad de prueba desde el panel se refleja en el sitio (anotar si fue inmediato o tardó, por el riesgo de `updateTag` en Netlify).

Avance (2026-11-19): release PR #13 (`c4b0c69`). En producción las fichas de slugs que no estaban en el build respondían 500 (el App Shell de Next 16.3 no funciona en Netlify); corregido con `ensureStatic = "navigation"` (PR #14, release PR #15 `9cfad3a`): ahora responden 404 si no existen. El usuario publicó una propiedad desde el panel: apareció **al instante** en el sitio (`updateTag` funciona en Netlify). Reportó que el selector de estado del panel volvía al estado anterior tras cambiarlo (React 19 restablece el formulario): corregido con `key` en la fila (PR #16, release PR #17 `02f75d5`), con test de regresión. El usuario confirmó la corrección (5.2).

## Workflow follow-up

- Archivar el change con `openspec archive` en `develop` cuando esté en producción.
- Marcar la spec 5 en el plan, roadmap y backlog de 1stDocs; registrar los textos y fotos pendientes del cliente para la spec 9.
