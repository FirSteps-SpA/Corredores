// Rótulo en mayúsculas espaciadas con líneas a los lados, como "PROPIEDADES DESTACADAS" del mockup.
export function Rotulo({ children, lineas = false, className = "" }: { children: React.ReactNode; lineas?: boolean; className?: string }) {
  return (
    <p className={`flex items-center justify-center gap-4 text-xs tracking-[0.3em] text-tinta/70 uppercase ${className}`}>
      {lineas && <span className="h-px w-16 bg-tinta/30" />}
      {children}
      {lineas && <span className="h-px w-16 bg-tinta/30" />}
    </p>
  );
}
