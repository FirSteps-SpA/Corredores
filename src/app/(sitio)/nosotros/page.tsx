import type { Metadata } from "next";
import Image from "next/image";
import { sobreNosotros, valores } from "@/contenido/sitio";
import { IconoValor } from "../_componentes/iconos";
import { FondoMarca } from "../_componentes/marcador";
import { Rotulo } from "../_componentes/titulo-seccion";

export const metadata: Metadata = {
  title: "Nosotros",
  description: "Corredora de propiedades en Iquique: atención cercana, transparente y profesional.",
  alternates: { canonical: "/nosotros" },
};

export default function Nosotros() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <div>
          <Rotulo className="!justify-start">{sobreNosotros.rotulo}</Rotulo>
          <h1 className="mt-2 mb-6 font-serif text-5xl text-tinta">{sobreNosotros.titulo}</h1>
          <div className="flex flex-col gap-4 text-tinta/80">
            {sobreNosotros.parrafos.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
        {sobreNosotros.imagen ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
            <Image src={sobreNosotros.imagen} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
        ) : (
          <FondoMarca className="aspect-[4/3] rounded-xl" />
        )}
      </div>
      <ul className="mt-14 grid grid-cols-2 gap-6 rounded-xl bg-crema p-8 sm:grid-cols-4">
        {valores.lista.map((v) => (
          <li key={v.texto} className="flex flex-col items-center gap-3 text-center text-sm text-tinta">
            <IconoValor icono={v.icono} className="size-10" />
            {v.texto}
          </li>
        ))}
      </ul>
    </div>
  );
}
