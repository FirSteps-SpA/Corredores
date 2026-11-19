# property-photos Specification

## Purpose
Define cómo la corredora administra las fotos de cada propiedad desde el panel: subirlas comprimidas, ordenarlas, elegir cuál es la portada y borrarlas, de modo que la galería pública muestre las fotos en el orden que ella decidió.

## Requirements

### Requirement: Subir fotos
El admin SHALL poder subir una o varias fotos a la vez a una propiedad existente desde su página del panel. Cada foto subida SHALL agregarse al final de la galería y quedar visible como miniatura sin recargar la página. Una propiedad SHALL tener como máximo 30 fotos.

#### Scenario: Varias fotos a la vez
- **WHEN** el admin elige tres fotos de su dispositivo para una propiedad sin fotos
- **THEN** las tres quedan en la galería en el orden en que las eligió y la primera es la portada

#### Scenario: Agregar a una galería existente
- **WHEN** el admin sube una foto a una propiedad que ya tiene fotos
- **THEN** la foto nueva queda al final

#### Scenario: Límite de fotos
- **WHEN** el admin intenta subir fotos que dejarían la propiedad con más de 30
- **THEN** no se sube ninguna de las que exceden el límite y ve un aviso del máximo

#### Scenario: Archivo que no es imagen
- **WHEN** el admin elige un archivo que no es JPEG, PNG ni WebP
- **THEN** ese archivo no se sube y ve un aviso con su nombre; los demás sí se suben

### Requirement: Fotos livianas
Antes de subirla, cada foto SHALL reducirse para que su lado mayor no supere 1600 píxeles y guardarse como JPEG, conservando la orientación con que se tomó. Una foto más chica que ese tamaño SHALL subirse sin agrandarse.

#### Scenario: Foto de celular
- **WHEN** el admin sube una foto de 4000 × 3000 píxeles
- **THEN** la foto guardada mide 1600 × 1200 píxeles y es JPEG

#### Scenario: Foto vertical
- **WHEN** el admin sube una foto tomada con el celular en vertical
- **THEN** la foto guardada se ve vertical

### Requirement: Orden y portada
El admin SHALL poder mover cada foto una posición antes o después y SHALL poder marcar cualquier foto como portada, lo que la pone primera. La primera foto SHALL ser la portada de la propiedad. El orden SHALL guardarse al momento.

#### Scenario: Mover una foto
- **WHEN** el admin mueve la tercera foto una posición antes
- **THEN** pasa a ser la segunda y el orden se mantiene al recargar

#### Scenario: Elegir portada
- **WHEN** el admin marca la cuarta foto como portada
- **THEN** pasa a ser la primera y las demás conservan su orden relativo

### Requirement: Borrar una foto
El admin SHALL poder borrar una foto tras confirmar. Borrarla SHALL quitarla de la galería y eliminar su archivo del almacenamiento. Si se borra la portada, la siguiente foto SHALL pasar a ser la portada.

#### Scenario: Borrar la portada
- **WHEN** el admin borra la primera foto y confirma
- **THEN** la foto desaparece, su archivo deja de estar disponible y la que era segunda pasa a ser la portada

#### Scenario: Borrado cancelado
- **WHEN** el admin pide borrar una foto y cancela la confirmación
- **THEN** la foto sigue en la galería

### Requirement: Solo el admin administra fotos
Subir, registrar, ordenar y borrar fotos SHALL estar permitido solo al admin, también si se invoca la acción directamente sin pasar por el panel.

#### Scenario: Cuenta no admin
- **WHEN** una cuenta autenticada que no es admin intenta registrar o borrar una foto
- **THEN** la operación se rechaza y la galería no cambia
