"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { Valores } from "@/lib/propiedades/esquema";
import { CARACTERISTICAS, COMUNAS, ESTADOS, MONEDAS, OPERACIONES, TIPOS } from "@/lib/propiedades/opciones";
import { slugDe } from "@/lib/propiedades/slug";
import { Enviar } from "../../campos";
import { guardarPropiedad, type EstadoFormulario } from "./acciones";
import { MapaSelector } from "./mapa-selector";

type Props = {
  id?: string;
  inicial: Valores;
  // Estado y slug guardados, para advertir si cambia el slug de una propiedad ya visible.
  original?: { estado: string; slug: string };
};

export function FormularioPropiedad({ id, inicial, original }: Props) {
  const [estado, accion] = useActionState<EstadoFormulario, FormData>(guardarPropiedad, { valores: inicial });
  const v = (campo: string) => String(estado.valores[campo] ?? "");
  const e = estado.errores ?? {};

  // Slug en vivo desde el título mientras no se edite a mano (en una propiedad nueva).
  const [titulo, setTitulo] = useState(v("titulo"));
  const [slug, setSlug] = useState(v("slug"));
  const [slugEditado, setSlugEditado] = useState(!!id || !!v("slug"));
  const slugVisible = slugEditado ? slug : slugDe(titulo);
  const avisoEnlaces = original && original.estado !== "borrador" && slugDe(slugVisible) !== original.slug;

  const marcadas = new Set([estado.valores.caracteristicas ?? []].flat());

  return (
    <form action={accion} noValidate className="flex flex-col gap-8">
      {id && <input type="hidden" name="id" value={id} />}

      {(estado.error || Object.keys(e).length > 0) && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
          {estado.error ?? "Revisa los campos marcados."}
        </p>
      )}

      <Seccion titulo="Publicación">
        <Texto
          etiqueta="Título"
          name="titulo"
          required
          error={e.titulo}
          className="sm:col-span-2"
          value={titulo}
          onChange={(ev) => setTitulo(ev.target.value)}
        />
        <div className="sm:col-span-2">
          <Texto
            etiqueta="Dirección web (slug)"
            name="slug"
            error={e.slug}
            value={slugVisible}
            onChange={(ev) => {
              setSlugEditado(true);
              setSlug(ev.target.value);
            }}
            ayuda="Se arma del título. Si ya existe, se le agrega un número."
          />
          {avisoEnlaces && (
            <p className="mt-1 text-xs text-amber-800">
              Esta propiedad ya es visible: si cambias la dirección, los enlaces que ya compartiste dejarán de funcionar.
            </p>
          )}
        </div>
        <Lista etiqueta="Estado" name="estado" opciones={ESTADOS} defaultValue={v("estado")} error={e.estado} />
        <Texto etiqueta="Código interno" name="codigo" defaultValue={v("codigo")} error={e.codigo} />
        <Casilla etiqueta="Destacada en el inicio" name="destacada" defaultChecked={v("destacada") === "on"} />
      </Seccion>

      <Seccion titulo="Operación y precio">
        <Lista etiqueta="Operación" name="operacion" opciones={OPERACIONES} defaultValue={v("operacion")} error={e.operacion} />
        <Lista etiqueta="Tipo" name="tipo" opciones={TIPOS} defaultValue={v("tipo")} error={e.tipo} />
        <Texto etiqueta="Precio" name="precio" inputMode="decimal" required defaultValue={v("precio")} error={e.precio} />
        <Lista etiqueta="Moneda" name="moneda" opciones={MONEDAS} defaultValue={v("moneda")} error={e.moneda} />
        <Texto
          etiqueta="Gastos comunes ($)"
          name="gastos_comunes"
          inputMode="decimal"
          defaultValue={v("gastos_comunes")}
          error={e.gastos_comunes}
        />
      </Seccion>

      <Seccion titulo="Ubicación">
        <Texto etiqueta="Comuna" name="comuna" required list="comunas" defaultValue={v("comuna")} error={e.comuna} />
        <datalist id="comunas">
          {COMUNAS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <Texto etiqueta="Sector" name="sector" placeholder="Cavancha, Playa Brava…" defaultValue={v("sector")} error={e.sector} />
        <Texto etiqueta="Región" name="region" defaultValue={v("region")} error={e.region} />
        <Texto etiqueta="Dirección" name="direccion" defaultValue={v("direccion")} error={e.direccion} />
        <Casilla
          etiqueta="Mostrar la dirección exacta en el sitio"
          name="mostrar_direccion"
          defaultChecked={v("mostrar_direccion") === "on"}
          ayuda="Si no, el sitio muestra solo sector y comuna, y en el mapa una zona aproximada."
        />
        <MapaSelector lat={v("lat")} lng={v("lng")} error={e.ubicacion} />
      </Seccion>

      <Seccion titulo="Características">
        {(
          [
            ["dormitorios", "Dormitorios"],
            ["banos", "Baños"],
            ["estacionamientos", "Estacionamientos"],
            ["bodegas", "Bodegas"],
            ["m2_utiles", "Superficie útil (m²)"],
            ["m2_totales", "Superficie total (m²)"],
          ] as const
        ).map(([campo, etiqueta]) => (
          <Texto key={campo} etiqueta={etiqueta} name={campo} inputMode="decimal" defaultValue={v(campo)} error={e[campo]} />
        ))}
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm text-tinta">Incluye</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CARACTERISTICAS.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="caracteristicas" value={c} defaultChecked={marcadas.has(c)} />
                {c[0].toUpperCase() + c.slice(1)}
              </label>
            ))}
          </div>
        </fieldset>
        <Texto
          etiqueta="Otras características"
          name="caracteristicas_otras"
          placeholder="Separadas por coma"
          defaultValue={v("caracteristicas_otras")}
          error={e.caracteristicas}
          className="sm:col-span-2"
        />
        <label className="flex flex-col gap-1 text-sm text-tinta sm:col-span-2">
          Descripción
          <textarea name="descripcion" rows={6} defaultValue={v("descripcion")} className={campoClase} />
          {e.descripcion && <Error texto={e.descripcion} />}
        </label>
      </Seccion>

      <div className="flex items-center gap-4">
        <Enviar>Guardar</Enviar>
        <Link href="/admin" className="text-sm text-tinta/70 hover:underline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}

const campoClase =
  "rounded-md border border-marino/20 bg-white px-3 py-2 text-base outline-none focus:border-oro focus:ring-2 focus:ring-oro/30 aria-invalid:border-red-600";

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-serif text-2xl text-marino">{titulo}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Error({ texto }: { texto: string }) {
  return <span className="text-xs text-red-700">{texto}</span>;
}

function Texto({
  etiqueta,
  error,
  ayuda,
  className = "",
  ...props
}: { etiqueta: string; name: string; error?: string; ayuda?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`flex flex-col gap-1 text-sm text-tinta ${className}`}>
      {etiqueta}
      <input aria-invalid={!!error} className={campoClase} {...props} />
      {error ? <Error texto={error} /> : ayuda && <span className="text-xs text-tinta/60">{ayuda}</span>}
    </label>
  );
}

function Lista({
  etiqueta,
  opciones,
  error,
  ...props
}: { etiqueta: string; name: string; opciones: Record<string, string>; error?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="flex flex-col gap-1 text-sm text-tinta">
      {etiqueta}
      <select aria-invalid={!!error} className={campoClase} {...props}>
        {Object.entries(opciones).map(([valor, texto]) => (
          <option key={valor} value={valor}>
            {texto}
          </option>
        ))}
      </select>
      {error && <Error texto={error} />}
    </label>
  );
}

function Casilla({ etiqueta, ayuda, ...props }: { etiqueta: string; name: string; ayuda?: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-start gap-2 self-end text-sm text-tinta">
      <input type="checkbox" className="mt-1" {...props} />
      <span>
        {etiqueta}
        {ayuda && <span className="block text-xs text-tinta/60">{ayuda}</span>}
      </span>
    </label>
  );
}
