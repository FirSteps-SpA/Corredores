import Link from "next/link";
import { Suspense } from "react";
import { exigirAdmin } from "@/lib/auth";
import { Cargando } from "../cargando";
import { FormularioContrasena } from "./formulario";

export default function Cuenta() {
  return (
    <Suspense fallback={<Cargando />}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  await exigirAdmin();
  return (
    <div className="flex max-w-md flex-col gap-6">
      <Link href="/admin" className="text-sm text-marino underline underline-offset-4">
        ← Volver al panel
      </Link>
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-6 font-serif text-3xl text-marino">Cambiar contraseña</h1>
        <FormularioContrasena />
      </div>
    </div>
  );
}
