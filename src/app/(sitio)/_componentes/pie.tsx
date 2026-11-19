import Image from "next/image";
import { correoContacto, instagram } from "@/lib/contacto";
import { CIUDAD, LEMA_PIE } from "@/contenido/sitio";
import { IconoCorreo, IconoInstagram, IconoUbicacion } from "./iconos";

export function Pie() {
  const correo = correoContacto();
  const ig = instagram();
  return (
    <footer className="bg-tinta text-white/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-10 md:flex-row md:items-center md:justify-between">
        <Image src="/brand/gycmar-logo-oscuro.svg" alt="GyCmar Propiedades Iquique" width={480} height={270} unoptimized className="h-auto w-36" />
        <ul className="flex flex-col gap-3 text-sm md:flex-row md:gap-8">
          <li className="flex items-center gap-2">
            <IconoUbicacion className="size-4 text-oro" />
            {CIUDAD}
          </li>
          {correo && (
            <li>
              <a href={`mailto:${correo}`} className="flex items-center gap-2 hover:text-white">
                <IconoCorreo className="size-4 text-oro" />
                {correo}
              </a>
            </li>
          )}
          {ig && (
            <li>
              <a href={ig.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white">
                <IconoInstagram className="size-4 text-oro" />@{ig.usuario}
              </a>
            </li>
          )}
        </ul>
        <p className="font-serif text-xl text-white italic md:border-l md:border-white/20 md:pl-8">{LEMA_PIE}</p>
      </div>
    </footer>
  );
}
