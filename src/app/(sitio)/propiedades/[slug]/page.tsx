import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITIO_URL, mensajePropiedad } from "@/lib/contacto";
import { precioTexto } from "@/lib/propiedades/formato";
import { ESTADOS, OPERACIONES, TIPOS, type Estado, type Moneda, type Operacion, type Tipo } from "@/lib/propiedades/opciones";
import { disponible } from "@/lib/propiedades/orden";
import { fichaPublica, slugsPublicos } from "@/lib/propiedades/publico";
import { descripcionFicha, imagenCompartir, jsonLdFicha } from "@/lib/seo";
import { JsonLd } from "../../_componentes/json-ld";
import { GaleriaFicha } from "../../_componentes/galeria";
import { IconoAuto, IconoBano, IconoCama, IconoSuperficie, IconoUbicacion } from "../../_componentes/iconos";
import { FondoMarca } from "../../_componentes/marcador";
import { BotonWhatsApp } from "../../_componentes/whatsapp";

// Con cacheComponents, generateStaticParams debe devolver al menos un slug: si no hay
// propiedades (CI con la base vacía) se usa uno que termina en notFound().
export async function generateStaticParams() {
  const slugs = await slugsPublicos();
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "__sin-propiedades__" }];
}

export async function generateMetadata({ params }: PageProps<"/propiedades/[slug]">): Promise<Metadata> {
  const p = await fichaPublica((await params).slug);
  // Next agrega noindex solo al llamar a notFound() en la página.
  if (!p) return { title: "Propiedad no encontrada" };
  const descripcion = descripcionFicha(p);
  const imagen = imagenCompartir(p.fotos[0]?.path ?? null, p.titulo);
  const ruta = `/propiedades/${p.slug}`;
  return {
    title: p.titulo,
    description: descripcion,
    alternates: { canonical: ruta },
    openGraph: { title: p.titulo, description: descripcion, url: ruta, images: [imagen] },
    twitter: { title: p.titulo, description: descripcion, images: [imagen.url] },
  };
}

// Un slug que no estaba en el build (propiedad publicada después) se genera completo en la primera
// visita, sin App Shell: desde Next 16.3 el App Shell para params nuevos es el comportamiento por
// defecto y en Netlify respondía 500 para todo slug nuevo. 'navigation' además exige que la ficha
// sea estática (solo datos con "use cache"), y notFound() responde 404 de verdad.
export const ensureStatic = "navigation";

export default async function Ficha({ params }: PageProps<"/propiedades/[slug]">) {
  const { slug } = await params;
  const p = await fichaPublica(slug);
  if (!p) notFound();

  const abierta = disponible(p);
  const url = `${SITIO_URL}/propiedades/${p.slug}`;
  const ubicacion = [p.mostrar_direccion ? p.direccion : null, p.sector, p.comuna].filter(Boolean).join(", ");
  const datos: [React.ReactNode, string, string | null][] = [
    [<IconoCama key="c" />, "Dormitorios", p.dormitorios?.toString() ?? null],
    [<IconoBano key="b" />, "Baños", p.banos?.toString() ?? null],
    [<IconoAuto key="a" />, "Estacionamientos", p.estacionamientos?.toString() ?? null],
    [<IconoSuperficie key="u" />, "Superficie útil", p.m2_utiles !== null ? `${p.m2_utiles.toLocaleString("es-CL")} m²` : null],
    [<IconoSuperficie key="t" />, "Superficie total", p.m2_totales !== null ? `${p.m2_totales.toLocaleString("es-CL")} m²` : null],
    [<IconoCasa key="o" />, "Bodegas", p.bodegas?.toString() ?? null],
  ];

  return (
    <article className="mx-auto max-w-6xl px-5 py-10">
      <JsonLd datos={jsonLdFicha(p)} />
      <Link href="/propiedades" className="text-sm text-tinta/70 hover:text-tinta">
        ← Propiedades
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-[3fr_2fr]">
        <div>
          {p.fotos.length ? (
            <GaleriaFicha titulo={p.titulo} fotos={p.fotos.map((f) => f.path)} />
          ) : (
            <FondoMarca className="aspect-[4/3] rounded-xl" />
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded bg-crema px-2.5 py-1 font-medium">{OPERACIONES[p.operacion as Operacion]}</span>
            <span className="rounded bg-crema px-2.5 py-1 font-medium">{TIPOS[p.tipo as Tipo]}</span>
            {p.estado !== "publicada" && (
              <span className="rounded bg-marino px-2.5 py-1 font-medium text-white">{ESTADOS[p.estado as Estado]}</span>
            )}
          </div>
          <h1 className="font-serif text-4xl leading-tight text-tinta">{p.titulo}</h1>
          <p className="flex items-center gap-2 text-sm text-tinta/70">
            <IconoUbicacion className="size-4" />
            {ubicacion}
          </p>
          <div>
            <p className="text-3xl font-semibold text-tinta">{precioTexto(p.precio, p.moneda as Moneda)}</p>
            {p.gastos_comunes !== null && (
              <p className="text-sm text-tinta/70">Gastos comunes: {precioTexto(p.gastos_comunes, "CLP")}</p>
            )}
            {p.codigo && <p className="mt-1 text-xs text-tinta/50">Código {p.codigo}</p>}
          </div>

          {abierta ? (
            <BotonWhatsApp mensaje={mensajePropiedad({ codigo: p.codigo, titulo: p.titulo, url })} className="w-full py-3">
              Consultar por WhatsApp
            </BotonWhatsApp>
          ) : (
            <p className="rounded-lg bg-crema p-4 text-sm text-tinta/80">
              Esta propiedad ya fue {p.estado === "arrendada" ? "arrendada" : "vendida"}.{" "}
              <Link href="/propiedades" className="underline underline-offset-2">
                Revisa otras propiedades
              </Link>{" "}
              o escríbenos si buscas algo similar.
            </p>
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-tinta/10 py-5 text-sm">
            {datos
              .filter(([, , valor]) => valor !== null)
              .map(([icono, etiqueta, valor]) => (
                <div key={etiqueta} className="flex items-center gap-2">
                  <span className="text-oro">{icono}</span>
                  <dt className="text-tinta/60">{etiqueta}</dt>
                  <dd className="ml-auto font-medium text-tinta">{valor}</dd>
                </div>
              ))}
          </dl>
        </div>
      </div>

      {(p.descripcion || p.caracteristicas.length > 0) && (
        <div className="mt-12 grid gap-10 lg:grid-cols-[3fr_2fr]">
          {p.descripcion && (
            <section>
              <h2 className="mb-3 font-serif text-2xl text-tinta">Descripción</h2>
              <p className="whitespace-pre-line text-tinta/80">{p.descripcion}</p>
            </section>
          )}
          {p.caracteristicas.length > 0 && (
            <section>
              <h2 className="mb-3 font-serif text-2xl text-tinta">Características</h2>
              <ul className="flex flex-wrap gap-2">
                {p.caracteristicas.map((c) => (
                  <li key={c} className="rounded-full bg-crema px-3 py-1 text-sm text-tinta first-letter:uppercase">
                    {c}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </article>
  );
}

function IconoCasa() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 10h16v10H4zM4 10l8-6 8 6M9 20v-5h6v5" />
    </svg>
  );
}
