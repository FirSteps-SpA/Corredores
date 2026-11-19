import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { exigirAdmin } from "@/lib/auth";
import { obtenerPropiedad } from "@/lib/propiedades/consultas";
import { Cargando } from "../../cargando";
import { FormularioPropiedad } from "../formulario";
import { valoresDe } from "../valores";

export default function Editar({ params }: PageProps<"/admin/propiedades/[id]">) {
  return (
    <Suspense fallback={<Cargando />}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: Pick<PageProps<"/admin/propiedades/[id]">, "params">) {
  await exigirAdmin();
  const { id } = await params;
  const propiedad = await obtenerPropiedad(id);
  if (!propiedad) notFound();
  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin" className="text-sm text-marino underline underline-offset-4">
        ← Propiedades
      </Link>
      <h1 className="font-serif text-4xl text-marino">{propiedad.titulo}</h1>
      <FormularioPropiedad
        id={propiedad.id}
        inicial={valoresDe(propiedad)}
        original={{ estado: propiedad.estado, slug: propiedad.slug }}
      />
    </div>
  );
}
