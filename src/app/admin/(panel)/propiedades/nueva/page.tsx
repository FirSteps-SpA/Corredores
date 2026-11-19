import Link from "next/link";
import { Suspense } from "react";
import { exigirAdmin } from "@/lib/auth";
import { Cargando } from "../../cargando";
import { FormularioPropiedad } from "../formulario";
import { valoresNueva } from "../valores";

export default function Nueva() {
  return (
    <Suspense fallback={<Cargando />}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  await exigirAdmin();
  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin" className="text-sm text-marino underline underline-offset-4">
        ← Propiedades
      </Link>
      <h1 className="font-serif text-4xl text-marino">Nueva propiedad</h1>
      <FormularioPropiedad inicial={valoresNueva} />
    </div>
  );
}
