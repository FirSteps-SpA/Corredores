// Datos de contacto de la corredora, por variables de entorno (Netlify). Lo que no esté
// configurado no se muestra: cada función devuelve null y los componentes no renderizan nada.

export const SITIO_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://gycmar.netlify.app").replace(/\/+$/, "");

export function enlaceWhatsApp(mensaje?: string, numero = process.env.NEXT_PUBLIC_WHATSAPP): string | null {
  const digitos = (numero ?? "").replace(/\D/g, "");
  if (!digitos) return null;
  return `https://wa.me/${digitos}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ""}`;
}

export function mensajePropiedad({ codigo, titulo, url }: { codigo?: string | null; titulo: string; url: string }) {
  return `Hola, me interesa la propiedad ${codigo ? `${codigo} – ` : ""}${titulo}: ${url}`;
}

export function correoContacto(valor = process.env.NEXT_PUBLIC_CONTACTO_EMAIL): string | null {
  const correo = valor?.trim();
  return correo && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ? correo : null;
}

// Acepta "gycmar", "@gycmar" o la URL completa.
export function instagram(valor = process.env.NEXT_PUBLIC_INSTAGRAM): { usuario: string; url: string } | null {
  const usuario = valor?.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/^@/, "").replace(/\/.*$/, "");
  return usuario ? { usuario, url: `https://www.instagram.com/${usuario}/` } : null;
}
