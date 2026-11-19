"use client";

import { useActionState } from "react";
import { iniciarSesion } from "../acciones";
import { Campo, Enviar, Mensaje } from "../campos";

export function FormularioLogin({ next }: { next?: string }) {
  const [estado, accion] = useActionState(iniciarSesion, {});
  return (
    <form action={accion} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <Campo
        etiqueta="Correo"
        name="email"
        type="email"
        autoComplete="username"
        autoFocus
        defaultValue={estado.email}
      />
      <Campo etiqueta="Contraseña" name="password" type="password" autoComplete="current-password" />
      <Mensaje estado={estado} />
      <Enviar>Entrar</Enviar>
    </form>
  );
}
