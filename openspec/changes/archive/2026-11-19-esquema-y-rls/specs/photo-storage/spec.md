# Spec Delta

## Purpose

Define dónde se guardan los archivos de las fotos de las propiedades, cómo se sirven al público y quién puede subirlos, reemplazarlos o borrarlos.

## ADDED Requirements

### Requirement: Fotos servidas por URL pública
Los archivos de fotos SHALL poder descargarse por su URL pública sin iniciar sesión, para mostrarlos en el sitio y en las previsualizaciones de redes sociales.

#### Scenario: Visitante abre una foto
- **WHEN** alguien sin sesión pide la URL pública de una foto subida
- **THEN** recibe la imagen

### Requirement: Solo el admin escribe fotos
Subir, reemplazar y borrar archivos de fotos SHALL estar permitido solo al admin. Nadie más SHALL poder listar el contenido del almacenamiento de fotos.

#### Scenario: Visitante intenta subir
- **WHEN** alguien sin sesión intenta subir un archivo al almacenamiento de fotos
- **THEN** la operación es rechazada

#### Scenario: Usuario no admin intenta borrar
- **WHEN** un usuario autenticado que no es admin intenta borrar una foto subida
- **THEN** la foto sigue disponible

#### Scenario: Visitante intenta listar
- **WHEN** alguien sin sesión pide la lista de archivos del almacenamiento de fotos
- **THEN** no obtiene ningún archivo

#### Scenario: Admin sube y borra
- **WHEN** el admin sube una foto y luego la borra
- **THEN** la foto queda disponible por su URL pública y después deja de estarlo

### Requirement: Solo imágenes de tamaño acotado
El almacenamiento de fotos SHALL aceptar solo imágenes JPEG, PNG o WebP de hasta 10 MB.

#### Scenario: Archivo que no es imagen
- **WHEN** el admin intenta subir un PDF
- **THEN** la operación es rechazada

#### Scenario: Imagen demasiado grande
- **WHEN** el admin intenta subir una imagen de más de 10 MB
- **THEN** la operación es rechazada
