# Spec Delta

## MODIFIED Requirements

### Requirement: Crear y editar una propiedad
El admin SHALL poder crear una propiedad y editar cualquiera desde un formulario con todos sus datos salvo las coordenadas. Al crear una propiedad SHALL ir a la página de esa propiedad con un aviso de que se guardó, para agregarle fotos. Al guardar una edición SHALL volver al listado con la propiedad guardada. El formulario de edición SHALL mostrar los valores actuales.

#### Scenario: Alta de una propiedad
- **WHEN** el admin completa los datos obligatorios y guarda una propiedad nueva
- **THEN** la propiedad queda guardada en el estado elegido y el admin llega a su página, donde puede agregar fotos

#### Scenario: Edición
- **WHEN** el admin cambia el precio de una propiedad y guarda
- **THEN** el listado muestra el precio nuevo

### Requirement: Listado de propiedades
La página principal del panel SHALL listar todas las propiedades, incluidos los borradores, de la modificada más recientemente a la más antigua, mostrando la miniatura de su portada (o un marcador si no tiene fotos), código, título, operación, tipo, precio con su moneda, estado y si está destacada.

#### Scenario: Catálogo con propiedades
- **WHEN** el admin abre el panel
- **THEN** ve todas las propiedades, la última modificada primero, cada una con la miniatura de su portada

#### Scenario: Catálogo vacío
- **WHEN** el admin abre el panel y no hay propiedades
- **THEN** ve un aviso de que no hay propiedades y el acceso a crear la primera
