# Tasks

## 1. Lógica de dominio y tests unitarios

- [x] 1.1 Instalar `zod` y `vitest` (con `npx -y npm@11 install`), agregar `npm test` (`vitest run`) y sumarlo al job `build` de CI. Verificar que `npm test` corre (sin tests todavía, sin error) y que el lockfile se generó con npm 11.
- [x] 1.2 `src/lib/propiedades/slug.ts` (`slugDe`, `slugLibre`) y `opciones.ts` (decisión 2) con tests: tildes, ñ, signos, espacios repetidos, largo máximo, texto sin letras, sufijos libres. Verificar con `npm test`.
- [x] 1.3 `src/lib/propiedades/formato.ts` (`precioTexto`) con tests para UF con y sin decimales y CLP. Verificar con `npm test`.
- [x] 1.4 `src/lib/propiedades/esquema.ts` (zod sobre `FormData`, decisión 2) con tests de cada regla de "Validación con mensajes por campo" y de números en formato chileno. Verificar con `npm test`.

## 2. Panel: listado

- [x] 2.1 Encabezado del layout con el correo (en `<Suspense>`) y los enlaces "Propiedades" y "Cambiar contraseña"; quitar el enlace de la portada. Verificar con `test:panel` que los controles de la spec 2 siguen pasando.
- [x] 2.2 `(panel)/page.tsx` como listado (decisión 7): tabla con código, título, operación, tipo, precio, estado y destacada; filtro por estado y búsqueda en la URL; estado vacío y sin resultados; aviso "Propiedad guardada". Verificar en el navegador con propiedades creadas en Supabase local.

## 3. Panel: formulario y acciones

- [x] 3.1 `acciones.ts` con `guardarPropiedad`, `cambiarEstado`, `alternarDestacada` y `eliminarPropiedad` (decisiones 4–6, 8), todas con `exigirAdmin()` y `updateTag("propiedades")`. Verificar con `npm run typecheck`.
- [x] 3.2 Formulario compartido de crear/editar con errores por campo y valores conservados, slug en vivo desde el título y aviso al cambiar el slug de una propiedad que no es borrador; páginas `propiedades/nueva` y `propiedades/[id]` (404 si no existe). Verificar en el navegador cada escenario de "Crear y editar", "Validación" y "Slug".
- [x] 3.3 Acciones rápidas en el listado (estado, destacada, eliminar con `confirm()`). Verificar en el navegador cada escenario de "Acciones rápidas" y "Eliminar", incluida la cancelación.

## 4. Controles automáticos

- [x] 4.1 Ampliar `scripts/test-panel.mjs` con los controles de la decisión 9 (crea y borra sus propiedades y archivos). Verificar que pasan contra `npm run build && npm start` y que el de cuenta no admin falla si se quita temporalmente `exigirAdmin()` de `guardarPropiedad` (revertir después).

## 5. Documentación y PR

- [x] 5.1 README: `npm test`, estructura de `src/lib/propiedades/`, etiqueta de caché `propiedades`. Verificar que `lint`, `typecheck`, `test`, `build`, `test:rls` y `test:panel` pasan.
- [x] 5.2 Commit gitmoji y PR de `feat/crud-propiedades` a `develop`. Verificar que `build` (con `npm test`) y `rls` terminan en verde.

## 6. Producción

- [ ] 6.1 (Con visto bueno explícito) Release a `main`. Verificar en https://gycmar.netlify.app/admin, con la cuenta de la corredora (la prueba la hace el usuario), que el listado vacío aparece y que se puede crear una propiedad de prueba en borrador y eliminarla.

## Workflow follow-up

- Archivar el change con `openspec archive` en `develop` cuando esté en producción.
- Marcar la spec 3 en el plan, roadmap y backlog de 1stDocs.
