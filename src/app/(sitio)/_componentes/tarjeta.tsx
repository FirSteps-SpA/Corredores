import Image from "next/image";
import Link from "next/link";
import { urlPublica } from "@/lib/fotos/rutas";
import { precioTexto } from "@/lib/propiedades/formato";
import { ESTADOS, OPERACIONES, type Estado, type Moneda, type Operacion } from "@/lib/propiedades/opciones";
import type { Tarjeta } from "@/lib/propiedades/publico";
import { IconoBano, IconoCama, IconoSuperficie } from "./iconos";
import { FondoMarca } from "./marcador";

export function TarjetaPropiedad({ p, prioridad = false }: { p: Tarjeta; prioridad?: boolean }) {
  const superficie = p.m2_utiles ?? p.m2_totales;
  const estadoVisible = p.estado !== "publicada" ? ESTADOS[p.estado as Estado] : null;
  return (
    <article className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-marino/10 transition-shadow hover:shadow-md">
      <Link href={`/propiedades/${p.slug}`} className="block">
        <div className="relative aspect-[4/3]">
          {p.portada ? (
            <Image
              src={urlPublica(p.portada)}
              alt={p.titulo}
              fill
              sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
              priority={prioridad}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <FondoMarca className="h-full w-full" />
          )}
          <span className="absolute top-3 left-3 rounded bg-crema px-2.5 py-1 text-xs font-medium text-tinta">
            {OPERACIONES[p.operacion as Operacion]}
          </span>
          {estadoVisible && (
            <span className="absolute top-3 right-3 rounded bg-marino px-2.5 py-1 text-xs font-medium text-white">{estadoVisible}</span>
          )}
        </div>
        <div className="flex flex-col gap-2 p-4">
          <h3 className="font-medium text-tinta">{p.titulo}</h3>
          <p className="text-xs text-tinta/60">{[p.sector, p.comuna].filter(Boolean).join(", ")}</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-tinta/70">
            {p.dormitorios !== null && (
              <li className="flex items-center gap-1">
                <IconoCama className="size-4" />
                {p.dormitorios} dorm.
              </li>
            )}
            {p.banos !== null && (
              <li className="flex items-center gap-1">
                <IconoBano className="size-4" />
                {p.banos} {p.banos === 1 ? "baño" : "baños"}
              </li>
            )}
            {superficie !== null && (
              <li className="flex items-center gap-1">
                <IconoSuperficie className="size-4" />
                {superficie.toLocaleString("es-CL")} m²
              </li>
            )}
          </ul>
          <p className="mt-1 text-lg font-semibold text-tinta">{precioTexto(p.precio, p.moneda as Moneda)}</p>
        </div>
      </Link>
    </article>
  );
}
