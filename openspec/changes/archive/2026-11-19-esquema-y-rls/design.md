# Design

## Context

- Spec 0 dejó Supabase local (`supabase/config.toml`, puertos 553xx, Postgres 17) sin migraciones, y
  `scripts/test-rls.mjs` sin dependencias, que lee URL y claves de `supabase status -o json` y ya prueba
  el registro cerrado y las contraseñas. El job `rls` de CI levanta Supabase con Storage activo y corre
  ese script.
- Producción: proyecto `ioslqobvauapjpwhkgts` (vinculado en `supabase/.temp/`), vacío, plan Pro con
  respaldos diarios.
- Referencia de patrones: VetApp (`supabase/migrations/*_rls.sql`, `*_endurecer_funciones.sql`): funciones
  `security definer` con `search_path` fijo y buckets con policies sobre `storage.objects`.
- El modelo de datos viene del plan (§3); las decisiones que el plan dejaba abiertas se cierran abajo.

## Goals / Non-Goals

**Goals:**
- `supabase db reset` en local deja el esquema completo; `npm run test:rls` prueba cada escenario de
  `catalog-access` y `photo-storage` contra la API real (PostgREST y Storage).
- Las mismas migraciones se aplican sin cambios en producción.

**Non-Goals:**
- Login y protección de `/admin` (spec 2); alta de la cuenta real de la corredora en `admins` (spec 2).
- Generación de slugs, formularios y revalidación (spec 3).
- Subida con compresión y **borrado de los archivos de Storage al borrar una propiedad** (spec 4: el
  `on delete cascade` solo borra los registros de `propiedad_fotos`, no los archivos).
- Datos de ejemplo (`seed.sql`): se agregan cuando haya pantallas que los muestren (specs 3 y 5).

## Decisions

1. **Tres migraciones** con fecha de hoy: `…_esquema.sql` (tablas, checks, índices, trigger
   `updated_at`), `…_rls.sql` (`es_admin()`, grants y policies) y `…_storage.sql` (bucket y policies de
   `storage.objects`). Separadas como en VetApp para leer el diff de seguridad aparte. Alternativa
   descartada: un solo archivo (más difícil de revisar).
2. **Listas cerradas con `check`**, no tablas ni enums: `operacion`, `moneda`, `estado` y `tipo` (casa,
   departamento, oficina, local, terreno, parcela, bodega). Agregar un valor es una migración de una
   línea (`drop constraint` + `add constraint`); un `enum` de Postgres no permite quitar valores y una
   tabla de tipos es más de lo que hace falta para 7 valores fijos.
3. **`sector` y `region` como texto libre.** En Iquique el sector (Cavancha, Playa Brava, Península…) dice
   más que la comuna, pero la lista real la da el cliente. El filtro de la spec 6 puede ofrecer los
   valores distintos existentes. Se revisa si aparecen variantes ("Cavancha" / "cavancha").
4. **Características como `text[] not null default '{}'`** (decisión abierta del plan): más simple de
   leer y escribir que `jsonb` y se puede filtrar con `@>` e índice GIN si la spec 6 lo necesita. Si
   alguna característica llega a necesitar un valor (no solo presencia), se pasa a columnas.
5. **Restricciones de valores**: slug con `^[a-z0-9]+(-[a-z0-9]+)*$` y único; `codigo` único opcional;
   `precio`, `gastos_comunes`, cantidades y superficies `>= 0`; `mostrar_direccion` y `destacada` `not
   null default false`. Sin `unique (propiedad_id, orden)` en fotos: reordenar con arrastrar (spec 4)
   chocaría con la restricción en cada paso; el orden se resuelve con `order by orden, id`.
6. **`es_admin()`**: `language sql stable security definer set search_path = ''`, `exists (select 1
   from public.admins where user_id = (select auth.uid()))`. `security definer` porque `admins` no es
   legible por el público; `search_path` vacío para que no se pueda suplantar `admins` (lección de la
   auditoría de VetApp). En las policies se llama como `(select public.es_admin())` para que Postgres la
   evalúe una vez por consulta y no por fila.
7. **Grants explícitos además de RLS**: `select` en `propiedades` y `propiedad_fotos` para `anon` y
   `authenticated`; `insert/update/delete` solo para `authenticated` (el admin siempre tiene sesión);
   en `admins`, solo `select` para `authenticated` y nada para `anon`. No dependemos de los privilegios
   por defecto del esquema `public`, que Supabase ha ido cambiando. RLS sigue siendo la barrera real.
8. **Policies** (todas con RLS activado):
   - `propiedades`: `select` con `estado <> 'borrador' or es_admin()`; `insert/update/delete` con
     `es_admin()` (`using` y `with check`).
   - `propiedad_fotos`: `select` si existe la propiedad con `estado <> 'borrador'`, o `es_admin()`;
     escritura con `es_admin()`.
   - `admins`: `select` donde `user_id = auth.uid()`; ninguna policy de escritura (las altas se hacen
     con SQL desde el panel o la clave secreta, fuera de la app).
   - Reservada es visible para el público (el plan dice `estado <> 'borrador'`): se muestra con
     etiqueta en la spec 5.
9. **Bucket `propiedades` público** (`public = true`, `file_size_limit` 10 MB, `allowed_mime_types`
   JPEG/PNG/WebP), creado con `insert … on conflict do nothing` en la migración. Las URLs públicas
   (`/storage/v1/object/public/…`) no pasan por RLS, así que **no hay policy de `select` para el
   público**: así nadie puede listar el bucket, que revelaría fotos de borradores. El admin sí tiene
   `select` (Storage lo exige para `upsert`, borrar y listar) además de `insert/update/delete`, todo con
   `bucket_id = 'propiedades' and es_admin()`. Convención de rutas para la spec 4:
   `<propiedad_id>/<uuid>.<ext>`. Alternativa descartada: bucket privado con URLs firmadas (rompe la
   caché del CDN y las imágenes OG de WhatsApp).
10. **Controles en `scripts/test-rls.mjs`**, siguiendo su estructura: con la clave secreta local se
    crean un usuario admin (fila en `admins`) y uno no admin, una propiedad publicada y una en borrador
    con una foto cada una. Después se prueba cada escenario de las specs como `anon`, no admin y admin,
    y al final se borra lo creado. Los escenarios de valores inválidos de `property-catalog` se prueban
    como admin (el error viene del `check`). Solo en modo local; `--remoto` sigue probando solo el
    registro (no hay clave secreta de producción en el equipo de desarrollo ni en CI).
11. **Tipos generados** con `supabase gen types typescript --local` en
    `src/lib/supabase/database.types.ts` y un script `npm run db:types`; los clientes de `client.ts` y
    `server.ts` pasan a `createBrowserClient<Database>` / `createServerClient<Database>`. Se regeneran
    en cada spec que cambie el esquema.

## Risks / Trade-offs

- [Fotos de un borrador accesibles si alguien conoce la URL] → las rutas llevan UUID (no adivinables) y
  el listado del bucket está cerrado; es el costo de usar URLs públicas cacheables. Aceptado.
- [Archivos huérfanos en Storage al borrar una propiedad] → se resuelve en la spec 4 (server action que
  borra archivos antes que la fila). Mientras no exista el panel no hay forma de borrar.
- [Grants explícitos que divergen de lo que Supabase da por defecto] → los tests prueban el
  comportamiento real por la API, no los grants.
- [Supabase CLI local (3.0.0-next) distinto de CI (3.2.0)] → CI es la referencia; si un control pasa en
  local y falla en CI, se actualiza el CLI local.

## Migration Plan

1. Validar en local: `supabase db reset` + `npm run test:rls` + `npm run build`.
2. PR `feat/esquema-y-rls` → `develop` con CI en verde.
3. **Con visto bueno explícito del usuario**: `supabase db push` al proyecto `ioslqobvauapjpwhkgts` (antes
   `supabase db push --dry-run` para ver qué se aplica). Verificar en el panel que las tablas tienen RLS
   activo y correr el advisor de seguridad.
4. Release `develop` → `main`: no cambia nada visible en el sitio.

Rollback: las tablas están vacías; una migración nueva que haga `drop` de tablas, función, policies y
bucket deja la base como antes. Respaldo diario de Pro disponible.

## Open Questions

- Valores definitivos de `tipo` y sectores frecuentes: se confirman en la reunión con el cliente; agregar
  un tipo es una migración de una línea (decisión 2) y no cambia las specs de acceso.
