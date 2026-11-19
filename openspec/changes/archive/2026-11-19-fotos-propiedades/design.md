# Design

## Context

- Spec 1: tabla `propiedad_fotos (id, propiedad_id, path, orden, alt)` sin `unique (propiedad_id,
  orden)` (para reordenar sin choques); bucket `propiedades` público, 10 MB, JPEG/PNG/WebP, escritura y
  listado solo del admin; rutas `<propiedad_id>/<uuid>.<ext>`.
- Spec 3: `eliminarPropiedad` ya borra los archivos `<id>/…`; panel con `exigirAdmin()` en cada página
  y action, `cacheComponents`, `updateTag("propiedades")` en cada cambio.
- Límite del cuerpo de una server action en Next: 1 MB por defecto; en Netlify las funciones aceptan
  ~6 MB. Una foto de celular pesa 3–8 MB antes de comprimir.
- `test:panel` envía formularios como multipart con los campos ocultos de React; no sirve para
  componentes que llaman a actions desde código (subida, orden) ni para la compresión, que ocurre en
  el navegador.

## Goals / Non-Goals

**Goals:**
- Subir desde el celular de la corredora fotos livianas y ordenarlas sin fricción.
- Pruebas en navegador real de todo el flujo de fotos, en CI.

**Non-Goals:**
- Texto alternativo editable por foto: el sitio público (spec 5) lo arma con el título y la posición.
- Miniaturas con transformación de imágenes de Supabase: se decide en la spec 5 (en local y en CI el
  servicio `imgproxy` está apagado). El panel muestra la foto comprimida, que ya es liviana.
- Recorte o rotación manual, marcas de agua.

## Decisions

1. **Compresión propia, sin librería** (`src/lib/fotos/comprimir.ts`, solo navegador):
   `createImageBitmap(archivo, { imageOrientation: "from-image" })` (aplica la orientación EXIF), escala
   al lado mayor ≤ 1600 sin agrandar, dibuja en un `canvas` y `toBlob("image/jpeg", 0.8)`. Alternativa
   descartada: `browser-image-compression` (sin versiones desde 2023 y hace lo mismo). **JPEG y no
   WebP**: Safari no siempre codifica WebP en `canvas` y devolvería PNG pesados; JPEG funciona en todos.
   El sitio público puede servir WebP con la transformación de Supabase (spec 5). Si el JPEG resultante
   pesa más que el original y el original ya cumple tamaño y formato, se sube el original.
2. **Subida directa del navegador a Storage** con el cliente de navegador y la sesión de la corredora:
   `storage.from("propiedades").upload("<propiedad_id>/<uuid>.jpg", blob, { contentType: "image/jpeg" })`.
   RLS del bucket ya limita la escritura al admin. Después, server action `registrarFoto(propiedadId,
   path)` con `exigirAdmin()` que valida que `path` empiece con `<propiedadId>/`, que el archivo exista
   (consulta a Storage) y que la propiedad tenga menos de 30 fotos, e inserta con `orden = max + 1`.
   Alternativa descartada: subir el archivo a una server action (choca con el límite de cuerpo y pasa
   dos veces por la red).
3. **Fotos de una en una, en el orden elegido** (input deshabilitado hasta hidratar: el `<input>` está
   en el HTML del servidor antes de que React conecte `onChange`, y fotos elegidas en ese momento se
   perdían; lo mostró un test intermitente y le pasaría a un celular lento): comprimir → subir → registrar, secuencial, con estado
   por archivo en la pantalla (comprimiendo, subiendo, lista, error). Un error en una foto no detiene
   las demás. Si el registro falla después de subir, la action de borrado de archivo huérfano se llama
   desde el cliente; si eso también falla, el archivo queda bajo `<id>/` y se borra al eliminar la
   propiedad (spec 3).
4. **Orden con botones, no arrastrar**: cada miniatura tiene "◀", "▶" y "Portada", más "Borrar". En el
   celular arrastrar es incómodo y en el computador los botones son igual de rápidos para galerías de
   10–20 fotos; además son accesibles con teclado y sin dependencias. Alternativa descartada:
   `@dnd-kit` (la versión para React 19 sigue en 0.x). Si la corredora pide arrastrar, se agrega.
   El plan decía "reordenar con arrastrar": cambio acordado en la propuesta.
5. **Una action para el orden**: `ordenarFotos(propiedadId, ids)` con `exigirAdmin()` recibe la lista
   completa en el orden nuevo, verifica que sean exactamente las fotos de esa propiedad y escribe
   `orden = índice` en cada una. "Portada" es mover al índice 0. El cliente actualiza la vista al
   momento y se queda con la galería que devuelve la action. **Si la action falla por la red** (sin
   señal), vuelve a lo último confirmado y avisa: sin ese `try/catch` la transición quedaba rechazada
   y los botones bloqueados (lo detectó el test que corta la petición).
6. **Borrar foto**: `eliminarFoto(fotoId)` con `exigirAdmin()` borra primero el archivo y después la
   fila (mismo criterio que la spec 3: no dejar filas sin archivo), y renumera el orden de las que
   quedan. Confirmación con `confirm()`.
7. **Cada action de fotos llama a `updateTag("propiedades")`**: la portada y la galería se ven en el
   sitio público.
8. **Página de la propiedad**: `/admin/propiedades/[id]` muestra primero la sección Fotos (componente
   cliente con las fotos iniciales leídas en el servidor) y después el formulario de datos. Tras crear,
   `guardarPropiedad` redirige a `/admin/propiedades/<id>?creada=1` (aviso "Propiedad creada. Agrega
   sus fotos."); tras editar sigue yendo al listado.
9. **URLs**: `src/lib/fotos/rutas.ts` con `urlPublica(path)` (`<SUPABASE_URL>/storage/v1/object/public/
   propiedades/<path>`) y `rutaNueva(propiedadId)`; el listado lee la portada con un `select` anidado
   (`propiedad_fotos(path, orden)`, la de menor `orden`). Las miniaturas son `<img loading="lazy">` con
   `object-cover`, sin `next/image` (las fotos ya vienen comprimidas y el optimizador de Next en Netlify
   sumaría costo).
10. **Playwright en el repo** (`@playwright/test` con versión fija 1.64.1, publicada hace más de un mes),
    `e2e/fotos.spec.ts` y `playwright.config.ts` (solo Chromium, `baseURL` local, sin levantar el
    servidor: lo levanta CI o la persona). Preparación con la clave secreta de Supabase local como
    `test:panel` (admin, propiedad) y limpieza al final. Imágenes de prueba generadas en el propio test
    con `canvas` (4000 × 3000 y vertical con EXIF de orientación 6 a partir de un JPEG pequeño incluido
    en `e2e/fixtures/`). Implementado sin archivos binarios: la foto vertical es un JPEG generado en
    el navegador al que el test le inserta un segmento EXIF con orientación 6. Casos: subir tres fotos en orden, tamaño 1600 × 1200 y JPEG del archivo
    guardado, orientación vertical, un PDF rechazado con aviso, mover, portada, borrar portada con
    confirmación y cancelación, límite de 30 (preparado con filas existentes), orden persistente al
    recargar y miniatura en el listado. En CI: job `rls`, después de `test:panel`, con
    `npx playwright install --with-deps chromium` (caché de `~/.cache/ms-playwright`). Script
    `npm run test:e2e`.
11. **Cuenta no admin**: no puede llegar a la página (spec 2) y RLS impide subir y escribir filas
    (spec 1, probado en `test:rls`). Las actions nuevas llaman a `exigirAdmin()`. Para probarlo, el test
    de Playwright captura (`page.route`) la petición real de `ordenarFotos` y de `eliminarFoto` que hace
    el admin (cabecera `Next-Action` y cuerpo) y la repite con la sesión de una cuenta no admin: la
    galería no cambia. Las actions llamadas desde código no dejan su id en el HTML, así que el
    método de `test:panel` (campos ocultos del formulario) no sirve aquí. Se verifican las dos
    barreras por separado: la respuesta de la action debe redirigir a `/admin/sin-acceso`
    (`x-action-redirect`, prueba `exigirAdmin()`) y la base no debe cambiar (prueba RLS). Comprobar
    solo la base no bastaba: sin `exigirAdmin()` RLS igual bloquea y el test pasaba.

## Risks / Trade-offs

- [HEIC en Android o en navegadores que no lo convierten] → el input acepta `image/jpeg,image/png,
  image/webp`; Safari en iPhone convierte HEIC a JPEG al elegir con ese `accept`. Si `createImageBitmap`
  no puede leer un archivo, se avisa por foto. Se revisa con el celular real de la corredora.
- [Subida interrumpida (mala señal)] → cada foto es independiente y muestra su error; se reintenta
  eligiéndola de nuevo. Los archivos huérfanos se limpian al eliminar la propiedad.
- [Playwright en CI suma ~1 minuto] → caché de navegadores; solo Chromium.
- [Botones en vez de arrastrar] → reversible si la corredora lo pide.

## Migration Plan

Sin migraciones. PR → `develop` con CI en verde; release a `main`. Prueba en producción con el celular
de la corredora (subir desde la galería y desde la cámara).

Rollback: revertir el merge; las fotos subidas quedan en Storage y en la tabla y reaparecen al reponer.

## Open Questions

- Máximo de 30 fotos por propiedad: se confirma con la corredora; cambiarlo es una constante.
