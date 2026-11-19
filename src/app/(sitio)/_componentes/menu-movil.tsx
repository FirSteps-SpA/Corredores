"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Cierra el <details> del menú de celular cuando cambia la página.
export function CerrarAlNavegar() {
  const ruta = usePathname();
  const marca = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    marca.current?.closest("details")?.removeAttribute("open");
  }, [ruta]);
  return <span ref={marca} hidden />;
}
