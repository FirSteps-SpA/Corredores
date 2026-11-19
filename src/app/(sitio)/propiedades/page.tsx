import type { Metadata } from "next";
import { listadoPublico } from "@/lib/propiedades/publico";
import { TarjetaPropiedad } from "../_componentes/tarjeta";
import { Rotulo } from "../_componentes/titulo-seccion";

export const metadata: Metadata = {
  title: "Propiedades",
  description: "Casas, departamentos y más en venta y arriendo en Iquique.",
};

export default async function Propiedades() {
  const propiedades = await listadoPublico();
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <Rotulo className="!justify-start">Compra • Vende • Arrienda</Rotulo>
      <h1 className="mt-2 mb-8 font-serif text-5xl text-tinta">Propiedades</h1>
      {propiedades.length === 0 ? (
        <p className="rounded-xl bg-crema p-8 text-center text-tinta/80">Muy pronto publicaremos nuestras propiedades.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {propiedades.map((p, i) => (
            <TarjetaPropiedad key={p.id} p={p} prioridad={i < 3} />
          ))}
        </div>
      )}
    </div>
  );
}
