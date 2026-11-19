import Image from "next/image";
import Link from "next/link";
import { hablamos, hero, sobreNosotros, valores } from "@/contenido/sitio";
import { destacadasInicio } from "@/lib/propiedades/publico";
import { IconoFlecha, IconoValor } from "./_componentes/iconos";
import { FondoMarca } from "./_componentes/marcador";
import { TarjetaPropiedad } from "./_componentes/tarjeta";
import { Rotulo } from "./_componentes/titulo-seccion";
import { BotonWhatsApp } from "./_componentes/whatsapp";

export default async function Inicio() {
  const destacadas = await destacadasInicio();
  return (
    <>
      <section className="relative">
        {hero.imagen ? (
          <div className="relative min-h-[460px] sm:min-h-[540px]">
            <Image src={hero.imagen} alt="" fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-marino/80 via-marino/40 to-transparent" />
          </div>
        ) : (
          <FondoMarca className="min-h-[460px] sm:min-h-[540px]" />
        )}
        <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col justify-center px-5">
          <div className="border-l border-white/70 pl-6 text-white sm:pl-8">
            <h1 className="font-serif text-5xl leading-tight sm:text-7xl">
              {hero.titulo}
              <br />
              <span className="italic">{hero.tituloEnfasis}</span>
            </h1>
            <p className="mt-4 text-xs tracking-[0.35em] uppercase sm:text-sm">{hero.bajada}</p>
          </div>
          <Link href="/propiedades" className="mt-8 inline-flex w-fit items-center gap-2 rounded-md bg-crema px-5 py-3 text-sm font-medium text-tinta hover:bg-white">
            Ver propiedades <IconoFlecha />
          </Link>
        </div>
      </section>

      {destacadas.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-16" aria-labelledby="destacadas">
          <Rotulo lineas className="mb-8">
            <span id="destacadas">Propiedades destacadas</span>
          </Rotulo>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destacadas.map((p, i) => (
              <TarjetaPropiedad key={p.id} p={p} prioridad={i === 0} />
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Link href="/propiedades" className="inline-flex items-center gap-2 rounded-full border border-tinta/60 px-6 py-2.5 text-sm hover:bg-tinta hover:text-white">
              Ver más propiedades <IconoFlecha />
            </Link>
          </div>
        </section>
      )}

      <section className="bg-crema">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[1fr_2fr] lg:items-center">
          <div>
            <Rotulo className="!justify-start">{valores.rotulo}</Rotulo>
            <h2 className="mt-3 font-serif text-4xl text-tinta">
              {valores.titulo} <span className="block italic">{valores.tituloEnfasis}</span>
            </h2>
          </div>
          <ul className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:divide-x lg:divide-tinta/15">
            {valores.lista.map((v) => (
              <li key={v.texto} className="flex flex-col items-center gap-3 px-2 text-center text-sm text-tinta">
                <IconoValor icono={v.icono} className="size-10 text-tinta" />
                {v.texto}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid md:grid-cols-2">
        {sobreNosotros.imagen ? (
          <div className="relative min-h-72">
            <Image src={sobreNosotros.imagen} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
        ) : (
          <FondoMarca className="min-h-72" />
        )}
        <div className="flex flex-col justify-center gap-4 px-5 py-14 md:px-12">
          <Rotulo className="!justify-start">{sobreNosotros.rotulo}</Rotulo>
          <h2 className="font-serif text-4xl text-tinta">{sobreNosotros.titulo}</h2>
          <p className="max-w-md text-tinta/80">{sobreNosotros.resumen}</p>
          <Link href="/nosotros" className="mt-2 inline-flex w-fit items-center gap-2 rounded-md bg-tinta px-5 py-3 text-sm text-white hover:bg-marino">
            Conoce más sobre nosotros <IconoFlecha />
          </Link>
        </div>
      </section>

      <section className="border-b border-white/10 bg-tinta text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-3xl">{hablamos.titulo}</h2>
            <p className="mt-1 text-sm text-white/80">{hablamos.texto}</p>
          </div>
          <BotonWhatsApp variante="oro">Escríbenos por WhatsApp</BotonWhatsApp>
        </div>
      </section>
    </>
  );
}
