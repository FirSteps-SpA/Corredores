import Image from "next/image";
import Link from "next/link";
import { CerrarAlNavegar } from "./menu-movil";
import { BotonWhatsApp } from "./whatsapp";

export const SECCIONES = [
  { href: "/", texto: "Inicio" },
  { href: "/propiedades", texto: "Propiedades" },
  { href: "/servicios", texto: "Servicios" },
  { href: "/nosotros", texto: "Nosotros" },
  { href: "/contacto", texto: "Contacto" },
];

export function Encabezado() {
  return (
    <header className="sticky top-0 z-30 border-b border-marino/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3">
        <Link href="/" aria-label="GyCmar Propiedades Iquique, inicio">
          <Image src="/brand/gycmar-logo-horizontal.svg" alt="GyCmar Propiedades Iquique" width={320} height={80} priority unoptimized className="h-auto w-36 sm:w-44" />
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-7 text-sm text-tinta md:flex">
          {SECCIONES.map((s) => (
            <Link key={s.href} href={s.href} className="hover:text-oro">
              {s.texto}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <BotonWhatsApp className="hidden sm:inline-flex">Escríbenos</BotonWhatsApp>
          {/* Menú de celular sin JavaScript: <details>. CerrarAlNavegar lo cierra al cambiar de página. */}
          <details className="group relative md:hidden">
            <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full border border-marino/20 [&::-webkit-details-marker]:hidden" aria-label="Menú">
              <svg className="size-5 group-open:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
              <svg className="hidden size-5 group-open:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </summary>
            <nav aria-label="Menú" className="absolute right-0 mt-2 flex w-56 flex-col rounded-xl bg-white p-2 shadow-lg ring-1 ring-marino/10">
              {SECCIONES.map((s) => (
                <Link key={s.href} href={s.href} className="rounded-lg px-4 py-3 text-tinta hover:bg-crema">
                  {s.texto}
                </Link>
              ))}
              <BotonWhatsApp className="m-2">Escríbenos</BotonWhatsApp>
            </nav>
            <CerrarAlNavegar />
          </details>
        </div>
      </div>
    </header>
  );
}
