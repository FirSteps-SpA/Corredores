# Spec Delta

## Purpose

Garantiza que el público general solo pueda ver las propiedades que la corredora decidió mostrar, y que solo la corredora (admin) pueda crear, modificar o borrar propiedades y fotos, sin importar si el acceso viene desde el sitio o directo a la API.

## ADDED Requirements

### Requirement: Identidad del admin
Un usuario SHALL ser admin solo si el equipo lo registró como tal; ningún usuario SHALL poder darse ese permiso a sí mismo ni ver quiénes son los demás admins.

#### Scenario: Usuario autenticado intenta hacerse admin
- **WHEN** un usuario autenticado que no es admin intenta registrarse como admin por la API
- **THEN** la operación es rechazada y sigue sin ser admin

#### Scenario: El admin consulta su condición
- **WHEN** el admin consulta si es admin
- **THEN** obtiene que sí, y solo ve su propio registro de admin

#### Scenario: El público consulta los admins
- **WHEN** alguien sin sesión consulta la lista de admins
- **THEN** no obtiene ningún registro

### Requirement: El público ve lo que no es borrador
Cualquier persona, con o sin sesión, SHALL poder ver las propiedades publicadas, reservadas, vendidas y arrendadas, con sus fotos. Las propiedades en `borrador` y sus fotos SHALL ser visibles solo para el admin.

#### Scenario: Visitante sin sesión
- **WHEN** alguien sin sesión lista las propiedades
- **THEN** ve las publicadas, reservadas, vendidas y arrendadas, y ninguna en borrador

#### Scenario: Fotos de un borrador
- **WHEN** alguien que no es admin lista las fotos de una propiedad en borrador
- **THEN** no obtiene ninguna

#### Scenario: Admin ve borradores
- **WHEN** el admin lista las propiedades
- **THEN** ve todas, incluidas las en borrador

### Requirement: Solo el admin modifica el catálogo
Crear, modificar y borrar propiedades y fotos SHALL estar permitido solo al admin. Para cualquier otra persona, con o sin sesión, el intento SHALL ser rechazado o no afectar ningún registro.

#### Scenario: Visitante intenta crear una propiedad
- **WHEN** alguien sin sesión intenta crear una propiedad por la API
- **THEN** la operación es rechazada

#### Scenario: Usuario no admin intenta modificar
- **WHEN** un usuario autenticado que no es admin intenta cambiar el precio o borrar una propiedad publicada
- **THEN** la propiedad no cambia

#### Scenario: Usuario no admin intenta agregar una foto
- **WHEN** un usuario autenticado que no es admin intenta registrar una foto en una propiedad
- **THEN** la operación es rechazada

#### Scenario: Admin administra el catálogo
- **WHEN** el admin crea, edita, cambia de estado y borra una propiedad y sus fotos
- **THEN** todas las operaciones se aplican

### Requirement: Controles automáticos de acceso
Las reglas de acceso de esta capacidad SHALL verificarse con controles automáticos contra la API real en cada cambio que llegue a `develop` o `main`.

#### Scenario: Una regla se rompe
- **WHEN** un cambio permite que alguien que no es admin vea un borrador o modifique una propiedad
- **THEN** los controles automáticos fallan y el cambio no se puede integrar
