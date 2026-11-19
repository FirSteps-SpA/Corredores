import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { exigirAdmin } from "@/lib/auth";
import { listarFotos, obtenerPropiedad } from "@/lib/propiedades/consultas";
import { Cargando } from "../../cargando";
import { FormularioPropiedad } from "../formulario";
import { valoresDe } from "../valores";
import { Galeria } from "./galeria";

export default function Editar(props: PageProps<"/admin/propiedades/[id]">) {
  return (
    <Suspense fallback={<Cargando />}>
      <Contenido {...props} />
    </Suspense>
  );
}

async function Contenido({ params, searchParams }: PageProps<"/admin/propiedades/[id]">) {
  await exigirAdmin();
  const { id } = await params;
  const propiedad = await obtenerPropiedad(id);
  if (!propiedad) notFound();
  const [fotos, { creada }] = await Promise.all([listarFotos(id), searchParams]);
  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin" className="text-sm text-marino underline underline-offset-4">
        ← Propiedades
      </Link>
      <h1 className="font-serif text-4xl text-marino">{propiedad.titulo}</h1>
      {creada && (
        <p role="status" className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-800">
          Propiedad creada. Agrega sus fotos.
        </p>
      )}
      <Galeria propiedadId={propiedad.id} fotosIniciales={fotos} />
      <FormularioPropiedad
        id={propiedad.id}
        inicial={valoresDe(propiedad)}
        original={{ estado: propiedad.estado, slug: propiedad.slug }}
      />
    </div>
  );
}
