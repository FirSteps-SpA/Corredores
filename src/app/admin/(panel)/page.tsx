import Link from "next/link";
import { Suspense } from "react";
import { exigirAdmin } from "@/lib/auth";
import { Cargando } from "./cargando";

export default function Panel() {
  return (
    <Suspense fallback={<Cargando />}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  const sesion = await exigirAdmin();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-4xl text-marino">Hola</h1>
        <p className="mt-1 text-sm text-tinta/70">Sesión iniciada como {sesion.email}</p>
      </div>
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <p className="text-tinta/80">Muy pronto podrás administrar tus propiedades desde aquí.</p>
      </div>
      <Link href="/admin/cuenta" className="text-sm text-marino underline underline-offset-4">
        Cambiar contraseña
      </Link>
    </div>
  );
}
