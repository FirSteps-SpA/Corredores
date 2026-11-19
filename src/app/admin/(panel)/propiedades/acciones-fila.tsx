"use client";

import { useActionState } from "react";
import { ESTADOS, type Estado } from "@/lib/propiedades/opciones";
import { alternarDestacada, cambiarEstado, eliminarPropiedad } from "./acciones";

// Celdas de estado y acciones rápidas de una fila del listado.
export function AccionesFila({ id, titulo, estado, destacada }: { id: string; titulo: string; estado: Estado; destacada: boolean }) {
  const [resultado, eliminar, eliminando] = useActionState(eliminarPropiedad, {});
  return (
    <>
      <td className="px-4 py-3">
        <form action={cambiarEstado}>
          <input type="hidden" name="id" value={id} />
          <select
            name="estado"
            defaultValue={estado}
            aria-label={`Estado de ${titulo}`}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="rounded-md border border-marino/20 bg-white px-2 py-1"
          >
            {(Object.keys(ESTADOS) as Estado[]).map((e) => (
              <option key={e} value={e}>
                {ESTADOS[e]}
              </option>
            ))}
          </select>
          <noscript>
            <button className="ml-2 underline">Cambiar</button>
          </noscript>
        </form>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-3">
          <form action={alternarDestacada}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="destacada" value={String(!destacada)} />
            <button
              aria-pressed={destacada}
              title={destacada ? "Quitar de destacadas" : "Destacar"}
              className={`text-lg leading-none ${destacada ? "text-oro" : "text-tinta/30 hover:text-oro"}`}
            >
              {destacada ? "★" : "☆"}
              <span className="sr-only">{destacada ? "Quitar de destacadas" : "Destacar"}</span>
            </button>
          </form>
          <form
            action={eliminar}
            onSubmit={(e) => {
              if (!confirm(`¿Eliminar "${titulo}"? Se borran también sus fotos. No se puede deshacer.`)) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={id} />
            <button disabled={eliminando} className="text-xs text-red-700 hover:underline disabled:opacity-50">
              Eliminar
            </button>
          </form>
        </div>
        {resultado.error && (
          <p role="alert" className="mt-1 text-right text-xs text-red-700">
            {resultado.error}
          </p>
        )}
      </td>
    </>
  );
}
