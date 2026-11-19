import { rangosBuscador } from "@/contenido/sitio";
import { TIPOS } from "@/lib/propiedades/opciones";
import { IconoCasa, IconoUbicacion } from "./iconos";

// Buscador del inicio (mockup): formulario GET al listado. `rango` fija operación, moneda y precio.
export function Buscador({ comunas }: { comunas: string[] }) {
  const campo = "w-full appearance-none bg-transparent py-3 pr-2 text-sm text-tinta outline-none";
  return (
    <form
      method="get"
      action="/propiedades"
      aria-label="Buscar propiedades"
      className="mx-auto grid max-w-5xl gap-2 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-marino/10 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center sm:rounded-full sm:px-6"
    >
      <label className="flex items-center gap-2 border-b border-marino/10 sm:border-r sm:border-b-0">
        <IconoCasa className="size-5 shrink-0 text-tinta/70" />
        <span className="sr-only">Tipo de propiedad</span>
        <select name="tipo" defaultValue="" className={campo}>
          <option value="">Tipo de propiedad</option>
          {Object.entries(TIPOS).map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 border-b border-marino/10 sm:border-r sm:border-b-0 sm:pl-2">
        <IconoUbicacion className="size-5 shrink-0 text-tinta/70" />
        <span className="sr-only">Comuna</span>
        <select name="comuna" defaultValue="" className={campo}>
          <option value="">Comuna</option>
          {comunas.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 sm:pl-2">
        <span className="text-lg text-tinta/70" aria-hidden>
          $
        </span>
        <span className="sr-only">Rango de precio</span>
        <select name="rango" defaultValue="" className={campo}>
          <option value="">Rango de precio</option>
          {rangosBuscador.map((g) => (
            <optgroup key={g.grupo} label={g.grupo}>
              {g.opciones.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {g.grupo}: {o.texto}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <button className="rounded-full bg-tinta px-8 py-3 text-sm font-medium text-white hover:bg-marino">Buscar</button>
    </form>
  );
}
