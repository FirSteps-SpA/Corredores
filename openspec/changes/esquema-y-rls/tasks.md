# Tasks

## 1. Esquema

- [x] 1.1 Crear `supabase/migrations/20261119000000_esquema.sql` con `propiedades`, `propiedad_fotos` (fk `on delete cascade`) y `admins` (fk a `auth.users` `on delete cascade`), los `check` de la decisión 2 y 5, `caracteristicas text[] not null default '{}'`, índices en `propiedades(estado)` y `propiedad_fotos(propiedad_id, orden)`, y trigger `updated_at` con `search_path` fijo. Verificar que `supabase db reset` aplica sin errores.

## 2. RLS

- [x] 2.1 Crear `supabase/migrations/20261119000001_rls.sql` con `es_admin()` (`security definer`, `search_path = ''`), grants explícitos (decisión 7), RLS activado en las tres tablas y las policies de la decisión 8. Verificar con `supabase db reset` y que `select relrowsecurity from pg_class` es `true` en las tres tablas.

## 3. Storage

- [x] 3.1 Crear `supabase/migrations/20261119000002_storage.sql` con el bucket `propiedades` (público, 10 MB, JPEG/PNG/WebP) y las policies de admin sobre `storage.objects` (decisión 9), sin `select` público. Verificar con `supabase db reset` que el bucket existe en `storage.buckets` con esos límites.

## 4. Controles automáticos

- [x] 4.1 Ampliar `scripts/test-rls.mjs` con la preparación de la decisión 10 (admin, no admin, propiedad publicada y borrador con fotos, limpieza al final). Verificar que el script sigue pasando sin controles nuevos y que no deja usuarios ni filas tras correr.
- [x] 4.2 Controles de `catalog-access`: identidad del admin (no admin no puede insertarse en `admins`; anon no ve admins; admin ve solo su fila y `es_admin()` da `true`), visibilidad (anon y no admin no ven el borrador ni sus fotos; admin sí) y escritura (anon y no admin no crean, editan ni borran propiedades ni fotos; admin sí). Verificar que pasan y que fallan si se cambia temporalmente la policy de `select` a `true` (revertir después).
- [x] 4.3 Controles de `property-catalog`: propiedad mínima con valores por defecto, rechazo de tipo desconocido, slug inválido, slug repetido y precio negativo, `updated_at` que avanza al editar y borrado en cascada de fotos. Verificar que pasan.
- [x] 4.4 Controles de `photo-storage`: admin sube y la URL pública responde 200 sin sesión; anon no sube ni lista; no admin no borra; admin no puede subir un PDF ni un archivo de más de 10 MB; admin borra y la URL responde 4xx. Verificar que pasan.

## 5. Tipos y clientes

- [x] 5.1 Agregar `npm run db:types` (`supabase gen types typescript --local > src/lib/supabase/database.types.ts`), generar el archivo y tipar `client.ts` y `server.ts` con `Database`. Verificar que `npm run lint`, `npm run typecheck` y `npm run build` pasan.

## 6. Documentación y PR

- [x] 6.1 Actualizar el README (migraciones, `db reset`, `db:types`, cómo dar de alta un admin con SQL) y el comentario de cabecera de `scripts/test-rls.mjs`. Verificar que las instrucciones funcionan desde `supabase db reset`.
- [ ] 6.2 Commit gitmoji y PR de `feat/esquema-y-rls` a `develop`. Verificar que `build` y `rls` terminan en verde.

## 7. Producción

- [ ] 7.1 (Con visto bueno explícito del usuario) `supabase db push --dry-run` y luego `supabase db push` al proyecto `ioslqobvauapjpwhkgts`. Verificar en el panel que las tablas existen con RLS activo, que el bucket tiene sus límites y que el advisor de seguridad no reporta problemas nuevos.
- [ ] 7.2 Verificar contra producción con la clave publishable que `GET /rest/v1/propiedades` responde 200 con `[]` y que un `POST` sin sesión es rechazado.

## Workflow follow-up

- Archivar el change con `/opsx:archive` cuando el PR esté mergeado.
- Marcar la spec 1 como ✅ en el plan y en el roadmap de 1stDocs.
