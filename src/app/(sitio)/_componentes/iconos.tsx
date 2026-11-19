// Íconos de línea del sitio público (trazo, heredan el color del texto).

type Props = { className?: string };
const base = (className = "size-5") => ({
  className,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const IconoCama = ({ className }: Props) => (
  <svg {...base(className)}><path d="M3 18V7M3 14h18v4M21 14v-3a3 3 0 0 0-3-3h-7v6M7 11.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" /></svg>
);
export const IconoBano = ({ className }: Props) => (
  <svg {...base(className)}><path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2ZM6 12V5a2 2 0 0 1 3.5-1.3M7 19l-1 2M17 19l1 2" /></svg>
);
export const IconoSuperficie = ({ className }: Props) => (
  <svg {...base(className)}><path d="M4 4h16v16H4zM4 9h5M15 4v5M9 20v-5h11" /></svg>
);
export const IconoAuto = ({ className }: Props) => (
  <svg {...base(className)}><path d="M5 16h14M6 16l1.5-5h9L18 16v3h-2v-1H8v1H6v-3ZM8 13.5h.01M16 13.5h.01" /></svg>
);
export const IconoTrato = ({ className }: Props) => (
  <svg {...base(className)}><path d="m11 17 2 2a1.4 1.4 0 0 0 2-2M14 14l2.5 2.5a1.4 1.4 0 0 0 2-2l-3.9-3.9a2 2 0 0 0-2.8 0l-.9.9a1.4 1.4 0 0 1-2-2l2.8-2.8a3.6 3.6 0 0 1 4.6-.4L21 8M3 8l2.2-2.2a3 3 0 0 1 3.5-.6L11 6M3 13l5.5 5.5a1.4 1.4 0 0 0 2-2" /></svg>
);
export const IconoCasa = ({ className }: Props) => (
  <svg {...base(className)}><path d="m3 11 9-7 9 7M5 9.5V20h14V9.5M10 20v-6h4v6" /></svg>
);
export const IconoEscudo = ({ className }: Props) => (
  <svg {...base(className)}><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const IconoUbicacion = ({ className }: Props) => (
  <svg {...base(className)}><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="9" r="2.5" /></svg>
);
export const IconoCorreo = ({ className }: Props) => (
  <svg {...base(className)}><path d="M3 6h18v12H3zM3 7l9 6 9-6" /></svg>
);
export const IconoInstagram = ({ className }: Props) => (
  <svg {...base(className)}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></svg>
);
export const IconoFlecha = ({ className = "size-4" }: Props) => (
  <svg {...base(className)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const IconoWhatsApp = ({ className = "size-5" }: Props) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
  </svg>
);

const VALORES = { trato: IconoTrato, casa: IconoCasa, escudo: IconoEscudo, ubicacion: IconoUbicacion };
export const IconoValor = ({ icono, className }: { icono: keyof typeof VALORES; className?: string }) => {
  const Icono = VALORES[icono];
  return <Icono className={className} />;
};
