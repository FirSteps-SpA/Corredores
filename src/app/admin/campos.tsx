"use client";

import { useFormStatus } from "react-dom";
import type { Estado } from "./acciones";

// Piezas de formulario compartidas por el login y el cambio de contraseña.

export function Campo({
  etiqueta,
  ...props
}: { etiqueta: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1 text-sm text-tinta">
      {etiqueta}
      <input
        required
        className="rounded-md border border-marino/20 bg-white px-3 py-2 text-base outline-none focus:border-oro focus:ring-2 focus:ring-oro/30"
        {...props}
      />
    </label>
  );
}

export function Enviar({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-marino px-6 py-3 text-sm text-white transition-colors hover:bg-tinta disabled:opacity-60"
    >
      {pending ? "Un momento…" : children}
    </button>
  );
}

export function Mensaje({ estado }: { estado: Estado }) {
  if (estado.error)
    return (
      <p role="alert" className="text-sm text-red-700">
        {estado.error}
      </p>
    );
  if (estado.ok)
    return (
      <p role="status" className="text-sm text-green-800">
        {estado.ok}
      </p>
    );
  return null;
}
