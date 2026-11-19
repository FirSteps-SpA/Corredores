import type { Metadata } from "next";
import { CIUDAD } from "@/contenido/sitio";
import { correoContacto, enlaceWhatsApp, instagram } from "@/lib/contacto";
import { IconoCorreo, IconoInstagram, IconoUbicacion, IconoWhatsApp } from "../_componentes/iconos";
import { Rotulo } from "../_componentes/titulo-seccion";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos por WhatsApp para comprar, vender o arrendar en Iquique.",
};

export default function Contacto() {
  const whatsapp = enlaceWhatsApp("Hola, quiero hacer una consulta.");
  const correo = correoContacto();
  const ig = instagram();
  const opcion = "flex items-center gap-4 rounded-xl bg-crema p-5 text-tinta hover:bg-oro-claro/40";
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <Rotulo className="!justify-start">Conversemos</Rotulo>
      <h1 className="mt-2 mb-8 font-serif text-5xl text-tinta">Contacto</h1>
      <ul className="flex flex-col gap-4">
        {whatsapp && (
          <li>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={opcion}>
              <IconoWhatsApp className="size-7 text-[#25d366]" />
              <span>
                <span className="block font-medium">WhatsApp</span>
                <span className="text-sm text-tinta/70">La forma más rápida de hablar con nosotros</span>
              </span>
            </a>
          </li>
        )}
        {correo && (
          <li>
            <a href={`mailto:${correo}`} className={opcion}>
              <IconoCorreo className="size-7 text-oro" />
              <span>
                <span className="block font-medium">Correo</span>
                <span className="text-sm text-tinta/70">{correo}</span>
              </span>
            </a>
          </li>
        )}
        {ig && (
          <li>
            <a href={ig.url} target="_blank" rel="noopener noreferrer" className={opcion}>
              <IconoInstagram className="size-7 text-oro" />
              <span>
                <span className="block font-medium">Instagram</span>
                <span className="text-sm text-tinta/70">@{ig.usuario}</span>
              </span>
            </a>
          </li>
        )}
        <li className="flex items-center gap-4 p-5 text-tinta">
          <IconoUbicacion className="size-7 text-oro" />
          {CIUDAD}
        </li>
      </ul>
    </div>
  );
}
