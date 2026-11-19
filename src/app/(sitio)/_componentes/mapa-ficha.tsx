"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { ATRIBUCION, HTML_MARCADOR, RADIO_APROXIMADO, TESELAS } from "@/lib/mapa";

// Mapa de la ficha (spec 8). Recibe coordenadas ya resueltas por la vista propiedades_publicas:
// exactas solo si la dirección es pública; si no, aproximadas, y se dibuja un círculo que contiene
// la ubicación real. Leaflet y las teselas se cargan recién cuando la sección está cerca de pantalla.
export function MapaFicha({ lat, lng, exacta }: { lat: number; lng: number; exacta: boolean }) {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    let mapa: import("leaflet").Map | null = null;
    let vivo = true;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        observador.disconnect();
        import("leaflet").then((L) => {
          if (!vivo) return;
          mapa = L.map(el, { scrollWheelZoom: false }).setView([lat, lng], exacta ? 15 : 14);
          L.tileLayer(TESELAS, { attribution: ATRIBUCION, maxZoom: 19 }).addTo(mapa);
          if (exacta) {
            const icono = L.divIcon({ html: HTML_MARCADOR, className: "", iconSize: [22, 22], iconAnchor: [11, 22] });
            L.marker([lat, lng], { icon: icono, keyboard: false }).addTo(mapa);
          } else {
            L.circle([lat, lng], { radius: RADIO_APROXIMADO, color: "#c89860", weight: 2, fillColor: "#04142c", fillOpacity: 0.15 }).addTo(mapa);
          }
        });
      },
      { rootMargin: "200px" },
    );
    observador.observe(el);
    return () => {
      vivo = false;
      observador.disconnect();
      mapa?.remove();
    };
  }, [lat, lng, exacta]);

  return <div ref={contenedor} className="z-0 h-80 w-full rounded-xl bg-crema" aria-label={exacta ? "Mapa con la ubicación" : "Mapa con la zona aproximada"} role="img" />;
}
