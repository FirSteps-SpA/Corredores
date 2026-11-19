# property-admin Specification

## Purpose
Define cómo la corredora administra su catálogo desde el panel: encontrar una propiedad, crearla o editarla con datos válidos, cambiar su estado o destacarla, y eliminarla con todo lo que tiene asociado.

## Requirements

### Requirement: Listado de propiedades
La página principal del panel SHALL listar todas las propiedades, incluidos los borradores, de la modificada más recientemente a la más antigua, mostrando código, título, operación, tipo, precio con su moneda, estado y si está destacada.

#### Scenario: Catálogo con propiedades
- **WHEN** el admin abre el panel
- **THEN** ve todas las propiedades, la última modificada primero

#### Scenario: Catálogo vacío
- **WHEN** el admin abre el panel y no hay propiedades
- **THEN** ve un aviso de que no hay propiedades y el acceso a crear la primera

### Requirement: Filtro y búsqueda
El listado SHALL poder filtrarse por estado y buscar por código o título sin distinguir mayúsculas ni tildes. El filtro y la búsqueda SHALL quedar en la URL.

#### Scenario: Filtro por estado
- **WHEN** el admin elige el estado "borrador"
- **THEN** ve solo las propiedades en borrador

#### Scenario: Búsqueda por título
- **WHEN** el admin busca "cavancha"
- **THEN** ve las propiedades cuyo título o código contiene "Cavancha", con o sin tilde ni mayúsculas

#### Scenario: Búsqueda sin resultados
- **WHEN** la búsqueda no coincide con ninguna propiedad
- **THEN** el admin ve un aviso de que no hay resultados

### Requirement: Crear y editar una propiedad
El admin SHALL poder crear una propiedad y editar cualquiera desde un formulario con todos sus datos salvo las coordenadas. Al guardar SHALL volver al listado con la propiedad guardada. El formulario de edición SHALL mostrar los valores actuales.

#### Scenario: Alta de una propiedad
- **WHEN** el admin completa los datos obligatorios y guarda
- **THEN** la propiedad queda guardada en el estado elegido y aparece en el listado

#### Scenario: Edición
- **WHEN** el admin cambia el precio de una propiedad y guarda
- **THEN** el listado muestra el precio nuevo

### Requirement: Validación con mensajes por campo
El sistema SHALL validar los datos en el servidor y, si alguno es inválido, SHALL rechazar el guardado, conservar lo ingresado y mostrar junto a cada campo qué está mal. Los obligatorios son título, operación, tipo, precio, moneda y comuna; precio, gastos comunes, cantidades y superficies no pueden ser negativos; las cantidades son enteras; un precio en pesos es entero.

#### Scenario: Falta un obligatorio
- **WHEN** el admin guarda sin precio
- **THEN** el guardado se rechaza, el campo precio muestra el error y el resto de lo ingresado se conserva

#### Scenario: Valor negativo
- **WHEN** el admin ingresa -2 dormitorios
- **THEN** el guardado se rechaza con un error en dormitorios

#### Scenario: Precio en pesos con decimales
- **WHEN** el admin ingresa un precio de 350000,5 en pesos
- **THEN** el guardado se rechaza con un error en precio

### Requirement: Slug para la URL
Cada propiedad SHALL tener un slug derivado del título (minúsculas, sin tildes, palabras separadas por guiones) que el admin puede editar. Si el slug ya lo usa otra propiedad, el sistema SHALL agregarle un sufijo numérico en vez de rechazar el guardado. Cambiar el slug de una propiedad que no está en borrador SHALL advertir que los enlaces ya compartidos dejarán de funcionar.

#### Scenario: Slug generado
- **WHEN** el admin crea "Casa en Cavancha, 3D 2B" sin escribir un slug
- **THEN** la propiedad queda con el slug `casa-en-cavancha-3d-2b`

#### Scenario: Slug repetido
- **WHEN** el admin crea una propiedad cuyo slug ya existe
- **THEN** se guarda con el slug terminado en `-2` (o el siguiente número libre)

#### Scenario: Cambio de slug de una propiedad publicada
- **WHEN** el admin edita el slug de una propiedad publicada
- **THEN** el formulario advierte que los enlaces compartidos dejarán de funcionar

### Requirement: Acciones rápidas desde el listado
Desde el listado, el admin SHALL poder cambiar el estado de una propiedad y marcarla o desmarcarla como destacada sin abrir el formulario.

#### Scenario: Marcar como vendida
- **WHEN** el admin cambia el estado de una propiedad publicada a "vendida" desde el listado
- **THEN** la propiedad queda vendida y el listado lo muestra

#### Scenario: Destacar
- **WHEN** el admin marca como destacada una propiedad
- **THEN** la propiedad queda destacada y el listado lo muestra

### Requirement: Eliminar una propiedad
El admin SHALL poder eliminar una propiedad tras confirmar. La eliminación SHALL borrar la propiedad, los registros de sus fotos y sus archivos en el almacenamiento de fotos.

#### Scenario: Eliminación confirmada
- **WHEN** el admin elimina una propiedad que tiene fotos subidas y confirma
- **THEN** la propiedad desaparece del listado y sus archivos de fotos dejan de estar disponibles

#### Scenario: Eliminación cancelada
- **WHEN** el admin pide eliminar una propiedad y cancela la confirmación
- **THEN** la propiedad sigue igual

### Requirement: Solo el admin modifica desde el panel
Toda acción del panel que crea, modifica o elimina propiedades SHALL rechazarse si quien la invoca no es admin, aunque la invoque directamente sin pasar por las páginas.

#### Scenario: Cuenta no admin invoca la acción de crear
- **WHEN** una cuenta autenticada que no es admin envía el formulario de crear propiedad
- **THEN** no se crea ninguna propiedad y es enviada a la página de sin acceso

### Requirement: Catálogo público actualizado tras cada cambio
Después de crear, editar, cambiar de estado, destacar o eliminar una propiedad, las páginas públicas que muestren el catálogo SHALL reflejar el cambio en la siguiente visita.

#### Scenario: Propiedad publicada
- **WHEN** el admin cambia una propiedad de borrador a publicada
- **THEN** la siguiente visita a una página pública del catálogo ya la incluye
