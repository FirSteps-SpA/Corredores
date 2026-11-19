# Design

## Context

- Tabla `propiedades` con `direccion`, `mostrar_direccion`, `lat`, `lng` (spec 1); RLS por fila: el
  público ve todo lo que no es borrador, **con todas sus columnas**. Verificado el 2026-11-19: con la
  clave publishable, `GET /rest/v1/propiedades?select=direccion` devuelve la dirección de una propiedad
  con `mostrar_direccion = false`. RLS no oculta columnas.
- El sitio público lee con la clave publishable sin sesión (`src/lib/propiedades/publico.ts`, rol
  `anon`). El panel lee y escribe con la sesión del admin (rol `authenticated`).
- La política de `propiedad_fotos` para el público consulta `propiedades` (`id`, `estado`) con el rol
  de quien pregunta.
- Ficha con `ensureStatic = "navigation"` y datos de `"use cache"`: el mapa debe ser un componente
  cliente que solo reciba datos ya seguros.
- `lat`/`lng` no están en el formulario ni en el esquema zod (spec 3).

## Goals / Non-Goals

**Goals:** marcar y mostrar la ubicación; que la ubicación exacta y la dirección ocultas no salgan de la
base hacia el público por ningún camino (página, payload, API).

**Non-Goals:**
- Mapa en el listado o búsqueda por mapa.
- Ocultar columnas a cuentas con sesión que no son admin: solo existen si el equipo las crea; el costo
  (permisos por columna también para `authenticated` y lecturas del panel por función) no se justifica.
  Queda registrado como riesgo.
- Geocodificación en el servidor o proveedor de mapas con clave.

## Decisions

1. **Vista `public.propiedades_publicas`** (migración `…_ubicacion_privada.sql`): mismas columnas que
   la tabla, filtra `estado <> 'borrador'`, y reemplaza
   - `direccion` → `case when mostrar_direccion then direccion end`,
   - `lat`/`lng` → exactas si `mostrar_direccion`; si no, **aproximadas** (decisión 2); `null` si no hay.
   La vista es del dueño (sin `security_invoker`): lee la tabla completa y aplica el filtro ella misma.
   `grant select` a `anon` y `authenticated`. El advisor de Supabase avisará "security definer view";
   es intencional (es la única forma de que lea columnas que `anon` ya no puede leer) y se documenta.
2. **Ubicación aproximada con sal secreta**: desplazamiento determinista (la misma cada visita, para que
   promediar visitas no revele el punto) de hasta ±0,0025° en latitud y su equivalente en longitud
   (≈ ±280 m), redondeado a 4 decimales, a partir de `md5(id || sal)`. La **sal** es aleatoria, se
   genera en la migración y vive en `privado.ajustes`, un esquema que la API no expone: sin la sal, el
   desplazamiento no se puede recalcular desde el `id` público. Distancia máxima al punto real ≈ 400 m,
   así que un círculo de **500 m** centrado en el punto aproximado siempre la contiene.
3. **Permisos por columna para `anon`**: `revoke select on propiedades from anon` y `grant select (todas
   menos direccion, lat, lng)`. La política de fotos sigue funcionando (usa `id` y `estado`). `select=*`
   de `anon` sobre la tabla pasa a dar error: el sitio usa la vista.
4. **`publico.ts` lee la vista**, con las fotos embebidas como antes (`propiedad_fotos(path, orden)`):
   PostgREST infiere la relación a través de la vista. Los tipos generados de la vista son todos
   nullable; se usan los de la tabla con `overrideTypes`. Mismas etiquetas de caché.
5. **Panel**: el esquema zod suma `lat`/`lng` (ambos o ninguno, rangos válidos; error en `ubicacion`); el
   formulario agrega un componente cliente `MapaSelector` con Leaflet: clic o arrastre para marcar,
   "Ubicar por dirección" (Nominatim: `nominatim.openstreetmap.org/search?format=jsonv2&limit=1&
   countrycodes=cl&q=<dirección, comuna, Chile>`, desde el navegador, una búsqueda por clic) y "Quitar
   ubicación". Escribe en inputs ocultos `lat`/`lng`. Centro por defecto: Iquique.
6. **Ficha**: componente cliente `MapaFicha` que recibe `{ lat, lng, exacta }` ya resueltos por la vista
   (nunca los exactos si están ocultos). Carga `leaflet` con `import()` cuando un `IntersectionObserver`
   detecta la sección cerca de pantalla. Exacta: `circleMarker` (sin imágenes de íconos, que fallan con
   los bundlers); aproximada: `circle` de 500 m y el aviso "Ubicación aproximada". Teselas de
   OpenStreetMap con atribución; zoom 15 (exacta) o 14.
7. **JSON-LD**: `geo` (`GeoCoordinates`) solo si la ubicación es exacta.
8. **Pruebas**:
   - `test:rls`: `anon` no puede leer `direccion`/`lat`/`lng` de la tabla; la vista no entrega
     borradores; con dirección oculta, `direccion` nula y coordenadas distintas de las exactas y a menos
     de 500 m (haversine); con dirección visible, exactas; el admin lee las exactas en la tabla.
   - Vitest: `lat`/`lng` en el esquema.
   - Playwright `e2e/mapa.spec.ts`: marcar con clic y guardar; "Ubicar por dirección" con Nominatim
     simulado (`page.route`), y sin resultados; quitar ubicación; ficha exacta, aproximada (sin las
     coordenadas exactas en el HTML) y sin ubicación; teselas no pedidas antes de bajar. Las teselas se
     responden con una imagen local (`page.route`): las pruebas no salen a internet.

## Risks / Trade-offs

- [Cuenta con sesión no admin lee la dirección en la tabla] → solo existe si el equipo la crea; el panel
  no permite crear cuentas. Documentado.
- [Política de uso de teselas de OpenStreetMap y Nominatim] → volumen bajo, atribución visible, una
  búsqueda por clic. Si el tráfico crece, cambiar a un proveedor con clave (MapTiler, Stadia) es una
  constante.
- [Advisor "security definer view"] → intencional; la vista solo expone lo que el público ya veía, con
  la dirección y las coordenadas protegidas.
- [Cambiar `mostrar_direccion` cambia la ubicación pública al instante] → la vista lo calcula en cada
  lectura; la caché se invalida con el panel como siempre.

## Migration Plan

1. Local: `supabase db reset`, `test:rls`, `db:types`.
2. PR → `develop` con CI en verde.
3. **Con visto bueno explícito**: `supabase db push --dry-run` y `supabase db push` a producción, y luego
   release a `main` (el código nuevo lee la vista: la migración va **antes** del deploy). Verificar con la
   clave publishable que la dirección ya no se lee de la tabla.

Rollback: migración inversa (borrar vista, función, esquema `privado` y devolver `select` a `anon`) y
revertir el merge.
