import Link from "next/link";
import { ORDENES, aParams, hayFiltros, type Filtros } from "@/lib/propiedades/filtros";
import { MONEDAS, OPERACIONES, TIPOS } from "@/lib/propiedades/opciones";

// Formulario GET de filtros y orden del listado: funciona sin JavaScript y deja todo en la URL.
const campo = "w-full rounded-md border border-marino/20 bg-white px-3 py-2 text-sm";

function Select({ etiqueta, name, valor, opciones, todas }: {
  etiqueta: string;
  name: string;
  valor?: string | number;
  opciones: Record<string, string> | string[];
  todas?: string;
}) {
  const pares = Array.isArray(opciones) ? opciones.map((o) => [o, o]) : Object.entries(opciones);
  return (
    <label className="flex flex-col gap-1 text-xs text-tinta/70">
      {etiqueta}
      <select name={name} defaultValue={valor ?? ""} className={campo}>
        {todas && <option value="">{todas}</option>}
        {pares.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}

const MINIMOS = { "1": "1 o más", "2": "2 o más", "3": "3 o más", "4": "4 o más" };

export function FormFiltros({ f, comunas, sectores }: { f: Filtros; comunas: string[]; sectores: string[] }) {
  return (
    // Plegable en celular sin JavaScript: checkbox + label (peer). Abierto si hay filtros activos;
    // en escritorio siempre visible. (Un <details> cerrado oculta el formulario también en escritorio.)
    <div className="rounded-xl bg-crema p-4">
      <input type="checkbox" id="ver-filtros" defaultChecked={hayFiltros(f)} className="peer sr-only" />
      <label htmlFor="ver-filtros" className="flex cursor-pointer items-center justify-between text-sm font-medium text-tinta md:hidden">
        Filtros {hayFiltros(f) ? "(activos)" : ""}
        <span aria-hidden>▾</span>
      </label>
      <form method="get" action="/propiedades" className="mt-4 hidden grid-cols-2 gap-3 peer-checked:grid md:mt-0 md:grid md:grid-cols-4 lg:grid-cols-6" aria-label="Filtros">
        <Select etiqueta="Operación" name="operacion" valor={f.operacion} opciones={OPERACIONES} todas="Todas" />
        <Select etiqueta="Tipo" name="tipo" valor={f.tipo} opciones={TIPOS} todas="Todos" />
        <Select etiqueta="Comuna" name="comuna" valor={f.comuna} opciones={comunas} todas="Todas" />
        <Select etiqueta="Sector" name="sector" valor={f.sector} opciones={sectores} todas="Todos" />
        <Select etiqueta="Dormitorios" name="dormitorios" valor={f.dormitorios} opciones={MINIMOS} todas="Cualquiera" />
        <Select etiqueta="Baños" name="banos" valor={f.banos} opciones={MINIMOS} todas="Cualquiera" />
        <label className="flex flex-col gap-1 text-xs text-tinta/70">
          Precio desde
          <input name="desde" inputMode="numeric" defaultValue={f.desde ?? ""} placeholder="Mínimo" className={campo} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-tinta/70">
          Precio hasta
          <input name="hasta" inputMode="numeric" defaultValue={f.hasta ?? ""} placeholder="Máximo" className={campo} />
        </label>
        <Select etiqueta="Precio en" name="moneda" valor={f.moneda} opciones={MONEDAS} />
        <Select etiqueta="Ordenar por" name="orden" valor={f.orden} opciones={ORDENES} />
        <label className="col-span-2 flex items-center gap-2 self-end pb-2 text-sm text-tinta">
          <input type="checkbox" name="disponibles" value="1" defaultChecked={f.disponibles} />
          Ocultar vendidas y arrendadas
        </label>
        <div className="col-span-2 flex items-end gap-3 md:col-span-4 lg:col-span-6">
          <button className="rounded-md bg-tinta px-6 py-2 text-sm text-white hover:bg-marino">Filtrar</button>
          {(hayFiltros(f) || f.orden !== "relevantes") && (
            <Link href="/propiedades" className="text-sm text-tinta/70 underline underline-offset-2">
              Limpiar filtros
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}

export function Paginacion({ f, pagina, totalPaginas }: { f: Filtros; pagina: number; totalPaginas: number }) {
  if (totalPaginas <= 1) return null;
  const enlace = (n: number) => `/propiedades${aParams(f, { pagina: n })}`;
  const boton = "rounded-md px-3 py-1.5 text-sm";
  return (
    <nav aria-label="Páginas" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {pagina > 1 && (
        <Link href={enlace(pagina - 1)} className={`${boton} text-tinta hover:bg-crema`}>
          ← Anterior
        </Link>
      )}
      {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
        <Link
          key={n}
          href={enlace(n)}
          aria-current={n === pagina ? "page" : undefined}
          className={`${boton} aria-[current=page]:bg-tinta aria-[current=page]:text-white hover:bg-crema`}
        >
          {n}
        </Link>
      ))}
      {pagina < totalPaginas && (
        <Link href={enlace(pagina + 1)} className={`${boton} text-tinta hover:bg-crema`}>
          Siguiente →
        </Link>
      )}
    </nav>
  );
}
