import type { Metadata } from "next";
import Link from "next/link";
import { filtrar, hayFiltros, leerFiltros, opcionesDe, ordenar, paginar } from "@/lib/propiedades/filtros";
import { listadoPublico } from "@/lib/propiedades/publico";
import { obtenerUF } from "@/lib/uf";
import { FormFiltros, Paginacion } from "../_componentes/filtros";
import { TarjetaPropiedad } from "../_componentes/tarjeta";
import { Rotulo } from "../_componentes/titulo-seccion";

export const metadata: Metadata = {
  title: "Propiedades",
  description: "Casas, departamentos y más en venta y arriendo en Iquique.",
  // Con filtros también: la canónica es el listado sin parámetros.
  alternates: { canonical: "/propiedades" },
};

// Los filtros vienen de la URL. Sin <Suspense> y con instant = false, la página se genera completa en
// cada visita (bloqueante): con <Suspense> Next envía los resultados como HTML oculto que mueve con
// JavaScript, y sin JavaScript no se veían. El catálogo y la UF salen de caché: filtrar y ordenar
// decenas de propiedades en memoria es inmediato.
export const instant = false;

export default async function Propiedades({ searchParams }: PageProps<"/propiedades">) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <Rotulo className="!justify-start">Compra • Vende • Arrienda</Rotulo>
      <h1 className="mt-2 mb-8 font-serif text-5xl text-tinta">Propiedades</h1>
      <Resultados searchParams={searchParams} />
    </div>
  );
}

async function Resultados({ searchParams }: Pick<PageProps<"/propiedades">, "searchParams">) {
  const f = leerFiltros(await searchParams);
  const [catalogo, uf] = await Promise.all([listadoPublico(), obtenerUF()]);
  const { comunas, sectores } = opcionesDe(catalogo);
  const resultado = paginar(ordenar(filtrar(catalogo, f, uf), f.orden, f.moneda, uf), f.pagina);

  return (
    <>
      <FormFiltros f={f} comunas={comunas} sectores={sectores} />
      {catalogo.length === 0 ? (
        <p className="mt-8 rounded-xl bg-crema p-8 text-center text-tinta/80">Muy pronto publicaremos nuestras propiedades.</p>
      ) : resultado.total === 0 ? (
        <div className="mt-8 rounded-xl bg-crema p-8 text-center text-tinta/80">
          <p>No hay propiedades que coincidan con tu búsqueda.</p>
          <Link href="/propiedades" className="mt-2 inline-block underline underline-offset-2">
            Limpiar filtros
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-8 mb-4 text-sm text-tinta/70" aria-live="polite">
            {resultado.total} {resultado.total === 1 ? "propiedad" : "propiedades"}
            {hayFiltros(f) && " con los filtros elegidos"}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resultado.items.map((p, i) => (
              <TarjetaPropiedad key={p.id} p={p} prioridad={i < 3} />
            ))}
          </div>
          <Paginacion f={f} pagina={resultado.pagina} totalPaginas={resultado.totalPaginas} />
        </>
      )}
    </>
  );
}
