import type { Metadata } from "next";
import { servicios } from "@/contenido/sitio";
import { Rotulo } from "../_componentes/titulo-seccion";
import { BotonWhatsApp } from "../_componentes/whatsapp";

export const metadata: Metadata = {
  title: "Servicios",
  description: "Venta, arriendo, compra y asesoría inmobiliaria en Iquique.",
  alternates: { canonical: "/servicios" },
};

export default function Servicios() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <Rotulo className="!justify-start">Lo que hacemos</Rotulo>
      <h1 className="mt-2 mb-10 font-serif text-5xl text-tinta">Servicios</h1>
      <ul className="grid gap-6 sm:grid-cols-2">
        {servicios.map((s) => (
          <li key={s.titulo} className="rounded-xl bg-crema p-6">
            <h2 className="font-serif text-2xl text-tinta">{s.titulo}</h2>
            <p className="mt-2 text-tinta/80">{s.texto}</p>
          </li>
        ))}
      </ul>
      <div className="mt-10">
        <BotonWhatsApp>Conversemos tu caso</BotonWhatsApp>
      </div>
    </div>
  );
}
