# Design

## Context

- Spec 1: tablas con `check` (operación, moneda, tipo, estado, slug `^[a-z0-9]+(-[a-z0-9]+)*$`, valores
  `>= 0`), `caracteristicas text[]`, `updated_at` por trigger, RLS (el admin lo ve y escribe todo) y
  bucket `propiedades` con rutas `<propiedad_id>/<uuid>.<ext>`; el admin puede listar y borrar.
- Spec 2: `exigirAdmin()` en `src/lib/auth.ts`, obligatoria en **cada página y server action** del
  panel (el layout no protege: Next serializa la página en el payload RSC). `cacheComponents` activo:
  lo que lee la sesión o datos va en `<Suspense>`. Formularios con `useActionState` y server actions;
  `test:panel` los envía como multipart con los campos ocultos de React.
- Spec 0 dejó pendiente Vitest "con la primera lógica propia (slugs, spec 3)".
- El plan (§4) proponía react-hook-form + zod y una vista previa; ver decisiones 3 y 10.

## Goals / Non-Goals

**Goals:**
- La corredora carga y mantiene su catálogo completo (salvo fotos y coordenadas) desde el panel.
- Validación única en el servidor, probada con tests unitarios; acciones probadas contra la app real.

**Non-Goals:**
- Fotos (spec 4): esta spec solo borra los archivos al eliminar una propiedad.
- Coordenadas y mapa (spec 8); vista previa de la ficha pública (decisión 10).
- Paginación del listado: el catálogo de un corredor es de decenas de propiedades. Se agrega si pasa
  de ~100.
- Redirecciones de slugs antiguos: el formulario advierte; si se vuelve un problema, tabla de alias.

## Decisions

1. **Rutas**: `/admin` es el listado (`(panel)/page.tsx`); `(panel)/propiedades/nueva/page.tsx` y
   `(panel)/propiedades/[id]/page.tsx` para crear y editar. Cada página llama a `exigirAdmin()` dentro de
   su `<Suspense>`. El encabezado del layout muestra el correo (componente en `<Suspense>` con
   `obtenerSesion()`) y los enlaces "Propiedades" y "Cambiar contraseña". Alternativa descartada:
   `/admin/propiedades` como listado y `/admin` como portada vacía (un clic más sin valor).
2. **Lógica de dominio en `src/lib/propiedades/`**, sin dependencias de Next, para probarla con Vitest:
   - `slug.ts`: `slugDe(texto)` (NFD sin diacríticos, minúsculas, todo lo que no sea `[a-z0-9]` a `-`,
     sin guiones repetidos ni en los extremos, máximo 80 caracteres) y `slugLibre(base, usados)` (base,
     `base-2`, `base-3`…).
   - `esquema.ts`: esquema **zod** que recibe `FormData` y entrega la fila para `propiedades` o los
     errores por campo. Números en formato chileno (`350.000`, `4.500,5`): se quitan los puntos de
     miles y la coma pasa a punto; vacío → `null` en opcionales. Reglas de la spec (obligatorios, no
     negativos, enteros en cantidades y en precio CLP, listas cerradas igual que los `check`).
   - `formato.ts`: `precioTexto(precio, moneda)` → `UF 4.500` / `$ 350.000` (`Intl.NumberFormat("es-CL")`),
     usado en el listado y luego en el sitio público.
   - `opciones.ts`: listas de operación, tipo, estado y moneda con sus etiquetas, características
     sugeridas (piscina, quincho, terraza, vista al mar, amoblado, acepta mascotas, ascensor,
     conserjería, estacionamiento de visitas, bodega) y comunas de la región (Iquique, Alto Hospicio,
     Pozo Almonte, Pica, Huara, Camiña, Colchane) como sugerencias de un `datalist`.
3. **Sin react-hook-form**: formulario HTML con `useActionState` y la validación zod en el servidor,
   como en la spec 2. Los errores vuelven por campo en el estado junto con lo ingresado (React 19
   vacía el formulario tras la acción; cada campo usa el valor devuelto como `defaultValue`). En el
   navegador solo atributos HTML (`required`, `min`, `step`) como ayuda. Motivo: una sola validación
   (la del servidor, que es la que cuenta) y formularios que `test:panel` puede enviar sin navegador.
   Alternativa descartada: react-hook-form + zodResolver (duplica la validación en el cliente, más
   código cliente y no se puede probar sin navegador).
4. **Slug**: en el formulario de alta, el campo slug se completa en vivo desde el título mientras la
   corredora no lo edite (componente cliente pequeño). En el servidor: si viene vacío se genera del
   título; se normaliza con `slugDe`; si está ocupado por otra propiedad se busca el siguiente libre con
   una consulta `slug like base%` y `slugLibre`. Si dos guardados compiten por el mismo slug, el
   `unique` de la tabla responde 23505 y la action reintenta una vez con el siguiente. En edición, si
   la propiedad no está en borrador y el slug cambia, se muestra el aviso de enlaces (cliente,
   comparando con el valor original).
5. **Server actions en `src/app/admin/(panel)/propiedades/acciones.ts`**: `guardarPropiedad` (crear o
   editar según venga `id`), `cambiarEstado`, `alternarDestacada` y `eliminarPropiedad`. Todas
   empiezan con `exigirAdmin()`; escriben con el cliente de servidor (sesión de la corredora, RLS
   aplica). `guardarPropiedad` redirige a `/admin?guardada=<slug>` (aviso "Propiedad guardada"); las
   rápidas recargan el listado con `refresh()` y devuelven a la misma URL (conserva filtro y búsqueda).
6. **Eliminar**: confirmación con `confirm()` del navegador en un botón cliente. La action lista los
   archivos con prefijo `<id>/` en el bucket, los borra (`remove`) y luego borra la fila (las filas de
   `propiedad_fotos` caen por `cascade`). Si borrar archivos falla, no borra la fila y muestra el error:
   mejor una propiedad que se puede reintentar que archivos huérfanos.
7. **Listado**: consulta con el cliente de servidor, `order("updated_at", { ascending: false })`;
   filtro `estado=eq.<estado>` si viene `?estado=`; búsqueda `?q=` sin tildes ni mayúsculas. Como
   PostgREST no tiene `unaccent` sin una extensión, se traen las filas (decenas) y se filtra en el
   servidor con la misma normalización de `slugDe`. Alternativa descartada: columna generada con
   `unaccent` (migración y extensión para un catálogo chico). Cambio de estado como `<select>` que envía
   su formulario al cambiar; destacada como botón ★/☆.
8. **Caché del sitio público**: cada action llama a `updateTag("propiedades")`. Las páginas públicas
   (spec 5) leerán el catálogo en funciones `"use cache"` con `cacheTag("propiedades")`. Una sola
   etiqueta: el catálogo es chico y casi cualquier cambio afecta al inicio y al listado. El panel no usa
   caché (lee con la sesión).
9. **Tests**:
   - **Vitest** 5 (`npm test`, en el job `build` de CI; exige `@types/node` ≥ 22, que se sube desde el
     `^20` de `create-next-app`: el proyecto ya requiere Node ≥ 22.22): `slugDe`, `slugLibre`, `precioTexto` y el esquema
     (obligatorios, números chilenos, negativos, enteros, CLP con decimales, listas cerradas,
     características, checkbox de destacada y mostrar dirección).
   - **`test:panel`**: listado con borradores para el admin y estado vacío; filtro y búsqueda sin
     tildes; alta (incluido slug generado y `-2` con un slug repetido); error por campo conservando lo
     ingresado; edición; cambio de estado; destacar; eliminar con un archivo subido en `<id>/` que deja
     de responder; la action de crear enviada por una cuenta no admin no crea nada; todo lo creado se
     borra al final.
   - Revisión en el navegador del formulario (Playwright local fuera del repo, como en la spec 2).
     Playwright en el repo se evalúa en la spec 4, donde la compresión de fotos ocurre en el cliente y
     sí necesita un navegador.
10. **Sin vista previa en esta spec**: la ficha pública no existe hasta la spec 5. Allí se agrega un
    enlace "Ver en el sitio" (los borradores visibles solo para el admin). Mientras, el listado y el
    formulario son la vista.

## Risks / Trade-offs

- [Filtro de búsqueda en memoria] → correcto para decenas de propiedades; si el catálogo crece, columna
  normalizada en la base.
- [`confirm()` del navegador es básico] → suficiente para una persona; un diálogo propio si se pide.
- [Cambiar el slug rompe enlaces compartidos] → aviso en el formulario; alias si pasa en la práctica.
- [El aviso de enlaces depende de JavaScript] → solo es un aviso; guardar funciona igual.

## Migration Plan

Sin migraciones. PR `feat/crud-propiedades` → `develop` con CI en verde; release a `main`. En producción
el catálogo está vacío: la corredora empieza a cargar en cuanto se publica.

Rollback: revertir el merge; las propiedades cargadas quedan en la base y vuelven a verse al reponer.

## Open Questions

- Lista definitiva de características sugeridas y de tipos: se confirman con la corredora; cambiar las
  sugerencias es editar `opciones.ts` y no cambia las specs.
