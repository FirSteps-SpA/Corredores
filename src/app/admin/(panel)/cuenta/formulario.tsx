"use client";

import { useActionState } from "react";
import { cambiarContrasena } from "../../acciones";
import { Campo, Enviar, Mensaje } from "../../campos";

export function FormularioContrasena() {
  const [estado, accion] = useActionState(cambiarContrasena, {});
  return (
    // key: tras un cambio correcto se vacían los campos
    <form key={estado.ok} action={accion} className="flex flex-col gap-4">
      <Campo etiqueta="Contraseña actual" name="actual" type="password" autoComplete="current-password" />
      <Campo etiqueta="Contraseña nueva" name="nueva" type="password" autoComplete="new-password" minLength={10} />
      <Campo etiqueta="Repite la contraseña nueva" name="confirmacion" type="password" autoComplete="new-password" />
      <p className="text-xs text-tinta/60">Al menos 10 caracteres, con letras y dígitos.</p>
      <Mensaje estado={estado} />
      <Enviar>Cambiar contraseña</Enviar>
    </form>
  );
}
