// Fondo de marca para cuando no hay foto: degradado marino con las líneas doradas del logo.
export function FondoMarca({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-marino via-[#0b2547] to-[#1d3a5f] ${className}`}>
      <svg className="absolute inset-x-0 bottom-0 h-2/3 w-full text-oro/40" viewBox="0 0 400 200" preserveAspectRatio="none" fill="none" stroke="currentColor" aria-hidden>
        <path d="M0 150C80 110 160 170 250 130S360 90 400 110" strokeWidth="1.5" />
        <path d="M0 170c90-35 170 25 260-15s110-35 140-20" strokeWidth="1" />
        <path d="M0 190c100-30 180 20 270-10s100-30 130-15" strokeWidth=".7" />
      </svg>
      {children}
    </div>
  );
}
