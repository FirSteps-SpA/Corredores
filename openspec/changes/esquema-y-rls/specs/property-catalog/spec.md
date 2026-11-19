# Spec Delta

## Purpose

Define qué datos guarda el sitio de cada propiedad y de sus fotos, qué valores son válidos y en qué estados puede estar una propiedad a lo largo de su vida (borrador, publicada, reservada, vendida o arrendada).

## ADDED Requirements

### Requirement: Datos de una propiedad
Cada propiedad SHALL tener un título, un slug único para su URL, una operación (`venta` o `arriendo`), un tipo, un precio con su moneda (`CLP` o `UF`), una comuna y un estado. SHALL poder tener además: código interno único, descripción, gastos comunes, región, sector, dirección, coordenadas, dormitorios, baños, estacionamientos, bodegas, metros cuadrados útiles y totales, una lista de características y la marca de destacada.

#### Scenario: Propiedad mínima
- **WHEN** el admin crea una propiedad con título, slug, operación, tipo, precio, moneda y comuna
- **THEN** la propiedad queda guardada en estado `borrador`, no destacada, sin características y con la dirección oculta

#### Scenario: Falta un dato obligatorio
- **WHEN** se intenta guardar una propiedad sin comuna o sin precio
- **THEN** la operación es rechazada

### Requirement: Valores válidos
El sistema SHALL rechazar una propiedad cuya operación, moneda, tipo o estado no esté en su lista cerrada; cuyo slug no sea de minúsculas, dígitos y guiones simples; o cuyo precio, gastos comunes, cantidades o superficies sean negativos. Los tipos válidos SHALL ser casa, departamento, oficina, local, terreno, parcela y bodega.

#### Scenario: Tipo desconocido
- **WHEN** se intenta guardar una propiedad de tipo `castillo`
- **THEN** la operación es rechazada

#### Scenario: Slug con mayúsculas o espacios
- **WHEN** se intenta guardar el slug `Casa Cavancha`
- **THEN** la operación es rechazada

#### Scenario: Slug repetido
- **WHEN** se intenta guardar una segunda propiedad con el slug de otra
- **THEN** la operación es rechazada

#### Scenario: Precio negativo
- **WHEN** se intenta guardar una propiedad con precio -1
- **THEN** la operación es rechazada

### Requirement: Estados de una propiedad
Una propiedad SHALL estar en uno de estos estados: `borrador`, `publicada`, `reservada`, `vendida` o `arrendada`. Cambiar de estado SHALL ser la forma normal de sacarla de la oferta; el borrado definitivo SHALL ser posible y SHALL eliminar también los registros de sus fotos.

#### Scenario: Propiedad vendida
- **WHEN** el admin cambia el estado de una propiedad publicada a `vendida`
- **THEN** la propiedad conserva todos sus datos y fotos

#### Scenario: Borrado de una propiedad con fotos
- **WHEN** el admin borra una propiedad que tiene fotos registradas
- **THEN** desaparecen la propiedad y los registros de sus fotos

### Requirement: Fecha de última modificación
Toda modificación de una propiedad SHALL actualizar su fecha de última modificación sin que quien la modifica tenga que indicarla.

#### Scenario: Edición del precio
- **WHEN** el admin cambia el precio de una propiedad
- **THEN** su fecha de última modificación pasa a ser la del cambio

### Requirement: Fotos de una propiedad
Cada foto SHALL pertenecer a una propiedad y tener la ruta de su archivo, una posición en el orden de la galería y, opcionalmente, un texto alternativo.

#### Scenario: Foto sin propiedad
- **WHEN** se intenta registrar una foto para una propiedad que no existe
- **THEN** la operación es rechazada
