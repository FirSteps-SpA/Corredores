import { enlaceWhatsApp } from "@/lib/contacto";
import { IconoWhatsApp } from "./iconos";

// Botón de WhatsApp. Sin número configurado no se renderiza nada.
export function BotonWhatsApp({
  mensaje,
  children,
  variante = "oscuro",
  className = "",
}: {
  mensaje?: string;
  children: React.ReactNode;
  variante?: "oscuro" | "claro" | "oro";
  className?: string;
}) {
  const href = enlaceWhatsApp(mensaje);
  if (!href) return null;
  const colores = {
    oscuro: "bg-tinta text-white hover:bg-marino",
    claro: "bg-white text-tinta hover:bg-crema",
    oro: "bg-oro-claro text-tinta hover:bg-oro",
  }[variante];
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${colores} ${className}`}
    >
      <IconoWhatsApp className="size-5" />
      {children}
    </a>
  );
}
