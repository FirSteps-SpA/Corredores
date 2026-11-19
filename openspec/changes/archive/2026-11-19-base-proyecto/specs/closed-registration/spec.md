# Spec Delta

## Purpose

Garantiza que solo existan las cuentas de administración creadas por el equipo: el público general nunca puede crearse una cuenta, ni desde la app ni llamando directamente a la API de autenticación.

## ADDED Requirements

### Requirement: Registro público cerrado
El sistema SHALL rechazar toda solicitud de registro de una cuenta nueva hecha con la clave pública, y SHALL no crear ningún usuario como resultado de ella.

#### Scenario: Registro por la API con la clave pública
- **WHEN** se envía una solicitud de registro con un correo y una contraseña válidos usando la clave pública del proyecto
- **THEN** la solicitud es rechazada y no se crea ningún usuario con ese correo

#### Scenario: Mismo comportamiento en local y en producción
- **WHEN** se ejecuta el control de registro contra el Supabase local y contra el proyecto de producción
- **THEN** ambos rechazan el registro

### Requirement: Cuentas creadas por el equipo
Las cuentas de administración SHALL crearse solo desde el panel de Supabase o con credenciales de servicio fuera de la app, y SHALL quedar confirmadas al crearse.

#### Scenario: Alta de la cuenta de la corredora
- **WHEN** el equipo crea la cuenta de la corredora desde el panel de Supabase con confirmación automática
- **THEN** la cuenta puede iniciar sesión sin pasar por un correo de confirmación

### Requirement: Contraseñas robustas
Las contraseñas de las cuentas SHALL tener al menos 10 caracteres e incluir letras y dígitos.

#### Scenario: Contraseña corta
- **WHEN** se intenta fijar una contraseña de 8 caracteres para una cuenta
- **THEN** la operación es rechazada por no cumplir el largo mínimo
