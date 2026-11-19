"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { urlPublica } from "@/lib/fotos/rutas";

// Galería de la ficha: carrusel con scroll-snap (se desliza con el dedo aunque no haya
// JavaScript) más flechas, contador y miniaturas.
export function GaleriaFicha({ titulo, fotos }: { titulo: string; fotos: string[] }) {
  const carrusel = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);
  const total = fotos.length;

  const ir = (i: number) => {
    const el = carrusel.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * Math.max(0, Math.min(total - 1, i)), behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div
          ref={carrusel}
          onScroll={(e) => setActual(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={`Fotos de ${titulo}`}
          role="region"
        >
          {fotos.map((path, i) => (
            <div key={path} className="relative aspect-[4/3] w-full shrink-0 snap-center bg-crema">
              <Image
                src={urlPublica(path)}
                alt={`${titulo} – foto ${i + 1} de ${total}`}
                fill
                sizes="(min-width: 1024px) 720px, 100vw"
                priority={i === 0}
                className="object-cover"
              />
            </div>
          ))}
        </div>
        {total > 1 && (
          <>
            <button type="button" onClick={() => ir(actual - 1)} disabled={actual === 0} aria-label="Foto anterior" className="absolute top-1/2 left-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-tinta shadow disabled:opacity-0">
              ‹
            </button>
            <button type="button" onClick={() => ir(actual + 1)} disabled={actual === total - 1} aria-label="Foto siguiente" className="absolute top-1/2 right-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-tinta shadow disabled:opacity-0">
              ›
            </button>
            <span className="absolute right-3 bottom-3 rounded-full bg-tinta/70 px-3 py-1 text-xs text-white" aria-live="polite">
              {actual + 1} / {total}
            </span>
          </>
        )}
      </div>
      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {fotos.map((path, i) => (
            <button
              key={path}
              type="button"
              onClick={() => ir(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === actual}
              className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md opacity-60 ring-oro aria-[current=true]:opacity-100 aria-[current=true]:ring-2"
            >
              <Image src={urlPublica(path)} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
