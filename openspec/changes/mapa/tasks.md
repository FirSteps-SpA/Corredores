# Tasks

## 1. Base de datos

- [x] 1.1 Migración `…_ubicacion_privada.sql` (decisiones 1–3): esquema `privado` con la sal, vista `propiedades_publicas`, permisos por columna de `anon`. Verificar con `supabase db reset` y `npm run db:types`.
- [x] 1.2 Controles en `scripts/test-rls.mjs` (decisión 8). Verificar que pasan y que el de lectura directa falla si se devuelve `select` completo a `anon` (revertir después).

## 2. Sitio público

- [x] 2.1 `publico.ts` lee la vista y las fotos aparte (decisión 4). Verificar que `test:e2e` del sitio y la búsqueda sigue pasando.
- [x] 2.2 `MapaFicha` y sección "Ubicación" en la ficha (decisión 6); `geo` en el JSON-LD solo si es exacta (decisión 7). Verificar en el navegador con ubicación exacta, aproximada y sin ubicación.

## 3. Panel

- [x] 3.1 `lat`/`lng` en el esquema con tests de Vitest; `MapaSelector` en el formulario con "Ubicar por dirección" y "Quitar ubicación" (decisión 5). Verificar en el navegador y con `npm test`.

## 4. Pruebas y PR

- [x] 4.1 `e2e/mapa.spec.ts` (decisión 8). Verificar que pasan y que el de ubicación aproximada falla si la ficha recibe las coordenadas de la tabla (revertir después).
- [x] 4.2 README (vista, ubicación aproximada, mapas). Verificar que `lint`, `typecheck`, `test`, `test:rls`, `test:panel` y `test:e2e` pasan.
- [ ] 4.3 Commit gitmoji y PR de `feat/mapa` a `develop`. Verificar que `build` y `rls` terminan en verde.

## 5. Producción

- [ ] 5.1 (Con visto bueno explícito) `supabase db push --dry-run` y `supabase db push`; luego release a `main`. Verificar con la clave publishable que `direccion` no se puede leer de la tabla y que la vista responde; advisor de seguridad revisado.
- [ ] 5.2 (Usuario) Marcar la ubicación de una propiedad en el panel y revisar la ficha con dirección visible y oculta.

## Workflow follow-up

- Archivar el change con `openspec archive` en `develop` cuando esté en producción.
- Marcar la spec 8 en el plan, roadmap y backlog de 1stDocs; registrar el hallazgo de la dirección expuesta por la API.
