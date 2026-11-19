"use client";

import { useRef, useState, useSyncExternalStore, useTransition } from "react";
import { comprimir, FotoNoValida } from "@/lib/fotos/comprimir";
import { BUCKET, MAXIMO_FOTOS, TIPOS_ACEPTADOS, rutaNueva, urlPublica } from "@/lib/fotos/rutas";
import type { Foto } from "@/lib/propiedades/consultas";
import { createClient } from "@/lib/supabase/client";
import { descartarArchivo, eliminarFoto, ordenarFotos, registrarFoto, type ResultadoFotos } from "./acciones-fotos";

type Pendiente = { nombre: string; estado: "en cola" | "comprimiendo" | "subiendo" | "lista" | "error"; error?: string };

// Galería de una propiedad: subir (comprimiendo en el navegador y subiendo directo a Storage),
// ordenar, elegir portada y borrar. Cada cambio se guarda al momento.
export function Galeria({ propiedadId, fotosIniciales }: { propiedadId: string; fotosIniciales: Foto[] }) {
  const [fotos, setFotos] = useState(fotosIniciales);
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [error, setError] = useState<string>();
  const [ocupado, iniciar] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const subiendo = pendientes.some((p) => !["lista", "error"].includes(p.estado));
  // El input existe en el HTML del servidor antes de que React conecte onChange: si se eligen
  // fotos en ese momento (celular lento) se perderían. Queda deshabilitado hasta hidratar.
  const hidratado = useSyncExternalStore(sinSuscripcion, () => true, () => false);

  // Ejecuta una acción de la galería. Si falla la red, vuelve a lo último confirmado por el
  // servidor y avisa; sin esto la transición quedaría rechazada y los botones bloqueados.
  function ejecutar(accion: () => Promise<ResultadoFotos>, confirmadas: Foto[]) {
    iniciar(async () => {
      try {
        const r = await accion();
        setFotos(r.fotos);
        setError(r.error);
      } catch {
        setFotos(confirmadas);
        setError("No se pudo guardar el cambio. Revisa la conexión e inténtalo de nuevo.");
      }
    });
  }

  async function subir(archivos: File[]) {
    setError(undefined);
    setPendientes(archivos.map((a) => ({ nombre: a.name, estado: "en cola" })));
    const marcar = (i: number, p: Partial<Pendiente>) =>
      setPendientes((lista) => lista.map((x, j) => (j === i ? { ...x, ...p } : x)));
    const supabase = createClient();
    let cantidad = fotos.length;

    for (const [i, archivo] of archivos.entries()) {
      if (cantidad >= MAXIMO_FOTOS) {
        marcar(i, { estado: "error", error: `Se alcanzó el máximo de ${MAXIMO_FOTOS} fotos.` });
        continue;
      }
      marcar(i, { estado: "comprimiendo" });
      let blob: Blob;
      try {
        blob = await comprimir(archivo);
      } catch (e) {
        marcar(i, { estado: "error", error: e instanceof FotoNoValida ? e.message : "No se pudo procesar." });
        continue;
      }
      marcar(i, { estado: "subiendo" });
      const path = rutaNueva(propiedadId);
      const { error: errorSubida } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: blob.type || "image/jpeg" });
      if (errorSubida) {
        marcar(i, { estado: "error", error: "No se pudo subir. Revisa la conexión e inténtalo de nuevo." });
        continue;
      }
      let r: ResultadoFotos;
      try {
        r = await registrarFoto(propiedadId, path);
      } catch {
        await descartarArchivo(propiedadId, path).catch(() => {});
        marcar(i, { estado: "error", error: "No se pudo registrar. Revisa la conexión e inténtalo de nuevo." });
        continue;
      }
      setFotos(r.fotos);
      if (r.error) {
        await descartarArchivo(propiedadId, path).catch(() => {});
        marcar(i, { estado: "error", error: r.error });
        continue;
      }
      cantidad = r.fotos.length;
      marcar(i, { estado: "lista" });
    }
    if (input.current) input.current.value = "";
  }

  function reordenar(nuevas: Foto[]) {
    const confirmadas = fotos;
    setFotos(nuevas);
    ejecutar(() => ordenarFotos(propiedadId, nuevas.map((f) => f.id)), confirmadas);
  }
  const mover = (i: number, delta: number) => {
    const nuevas = [...fotos];
    [nuevas[i], nuevas[i + delta]] = [nuevas[i + delta], nuevas[i]];
    reordenar(nuevas);
  };
  const portada = (i: number) => reordenar([fotos[i], ...fotos.filter((_, j) => j !== i)]);
  const borrar = (foto: Foto, i: number) => {
    if (!confirm(`¿Borrar la foto ${i + 1}? No se puede deshacer.`)) return;
    ejecutar(() => eliminarFoto(propiedadId, foto.id), fotos);
  };

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm" aria-labelledby="titulo-fotos">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-fotos" className="font-serif text-2xl text-marino">
          Fotos <span className="text-base text-tinta/50">({fotos.length} de {MAXIMO_FOTOS})</span>
        </h2>
        <label className="cursor-pointer rounded-full bg-marino px-5 py-2.5 text-sm text-white hover:bg-tinta has-disabled:opacity-60">
          Subir fotos
          <input
            ref={input}
            type="file"
            name="fotos"
            accept={TIPOS_ACEPTADOS.join(",")}
            multiple
            disabled={!hidratado || subiendo || fotos.length >= MAXIMO_FOTOS}
            className="sr-only"
            onChange={(e) => e.target.files?.length && subir([...e.target.files])}
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {pendientes.length > 0 && (
        <ul className="mb-4 flex flex-col gap-1 text-sm" aria-label="Fotos en proceso">
          {pendientes.map((p, i) => (
            <li key={i} className={p.estado === "error" ? "text-red-700" : "text-tinta/70"}>
              {p.nombre}: {p.estado === "error" ? p.error : p.estado}
            </li>
          ))}
        </ul>
      )}

      {fotos.length === 0 ? (
        <p className="text-sm text-tinta/70">Todavía no hay fotos. La primera que subas será la portada.</p>
      ) : (
        <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-busy={ocupado}>
          {fotos.map((f, i) => (
            <li key={f.id} className="flex flex-col gap-2" data-path={f.path}>
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- ya viene comprimida */}
                <img
                  src={urlPublica(f.path)}
                  alt={`Foto ${i + 1}`}
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-md bg-crema object-cover"
                />
                {i === 0 && (
                  <span className="absolute top-2 left-2 rounded-full bg-marino px-2 py-0.5 text-xs text-white">Portada</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1 text-xs">
                <Boton onClick={() => mover(i, -1)} disabled={ocupado || i === 0} etiqueta={`Mover la foto ${i + 1} antes`}>
                  ◀
                </Boton>
                <Boton onClick={() => mover(i, 1)} disabled={ocupado || i === fotos.length - 1} etiqueta={`Mover la foto ${i + 1} después`}>
                  ▶
                </Boton>
                {i > 0 && (
                  <Boton onClick={() => portada(i)} disabled={ocupado} etiqueta={`Usar la foto ${i + 1} como portada`}>
                    Portada
                  </Boton>
                )}
                <button
                  type="button"
                  onClick={() => borrar(f, i)}
                  disabled={ocupado}
                  aria-label={`Borrar la foto ${i + 1}`}
                  className="ml-auto text-red-700 hover:underline disabled:opacity-40"
                >
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

const sinSuscripcion = () => () => {};

function Boton({ etiqueta, children, ...props }: { etiqueta: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      title={etiqueta}
      className="rounded border border-marino/20 px-2 py-1 hover:border-marino disabled:opacity-30"
      {...props}
    >
      {children}
    </button>
  );
}
