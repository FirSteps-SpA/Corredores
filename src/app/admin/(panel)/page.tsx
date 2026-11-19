import Link from "next/link";
import { Suspense } from "react";
import { exigirAdmin } from "@/lib/auth";
import { listarPropiedades } from "@/lib/propiedades/consultas";
import { precioTexto } from "@/lib/propiedades/formato";
import { ESTADOS, OPERACIONES, TIPOS, type Estado } from "@/lib/propiedades/opciones";
import { Cargando } from "./cargando";
import { AccionesFila } from "./propiedades/acciones-fila";

export default function Panel({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<Cargando />}>
      <Listado searchParams={searchParams} />
    </Suspense>
  );
}

const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

async function Listado({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  await exigirAdmin();
  const params = await searchParams;
  const estado = texto(params.estado);
  const filtro = estado && estado in ESTADOS ? (estado as Estado) : undefined;
  const q = texto(params.q) ?? "";
  const guardada = texto(params.guardada);
  const propiedades = await listarPropiedades({ estado: filtro, q });
  const filtrando = !!filtro || !!q.trim();

  const enlaceEstado = (e?: Estado) => {
    const u = new URLSearchParams();
    if (e) u.set("estado", e);
    if (q) u.set("q", q);
    return `/admin${u.size ? `?${u}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-4xl text-marino">Propiedades</h1>
        <Link href="/admin/propiedades/nueva" className="rounded-full bg-marino px-5 py-2.5 text-sm text-white hover:bg-tinta">
          Nueva propiedad
        </Link>
      </div>

      {guardada && (
        <p role="status" className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-800">
          Propiedad guardada.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <nav className="flex flex-wrap gap-1 text-sm" aria-label="Filtrar por estado">
          {[undefined, ...(Object.keys(ESTADOS) as Estado[])].map((e) => (
            <Link
              key={e ?? "todas"}
              href={enlaceEstado(e)}
              aria-current={filtro === e ? "page" : undefined}
              className="rounded-full px-3 py-1 text-tinta/70 hover:bg-white aria-[current=page]:bg-marino aria-[current=page]:text-white"
            >
              {e ? ESTADOS[e] : "Todas"}
            </Link>
          ))}
        </nav>
        <form className="ml-auto flex gap-2" role="search">
          {filtro && <input type="hidden" name="estado" value={filtro} />}
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Buscar por título o código"
            className="w-56 rounded-md border border-marino/20 bg-white px-3 py-1.5 text-sm"
          />
          <button className="rounded-md border border-marino/20 bg-white px-3 py-1.5 text-sm hover:border-marino">Buscar</button>
        </form>
      </div>

      {propiedades.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          {filtrando ? (
            <p className="text-tinta/80">No hay propiedades que coincidan con la búsqueda.</p>
          ) : (
            <>
              <p className="text-tinta/80">Todavía no hay propiedades.</p>
              <Link href="/admin/propiedades/nueva" className="mt-3 inline-block text-sm text-marino underline underline-offset-4">
                Crear la primera
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-marino/10 text-xs tracking-wide text-tinta/60 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Propiedad</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {propiedades.map((p) => (
                <tr key={p.id} className="border-b border-marino/5 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/propiedades/${p.id}`} className="font-medium text-marino hover:underline">
                      {p.titulo}
                    </Link>
                    <div className="text-xs text-tinta/60">
                      {[p.codigo, OPERACIONES[p.operacion as keyof typeof OPERACIONES], TIPOS[p.tipo as keyof typeof TIPOS], p.sector ?? p.comuna]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{precioTexto(p.precio, p.moneda as "UF" | "CLP")}</td>
                  <AccionesFila id={p.id} titulo={p.titulo} estado={p.estado as Estado} destacada={p.destacada} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
