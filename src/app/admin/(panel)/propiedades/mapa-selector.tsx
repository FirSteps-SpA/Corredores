"use client";

import "leaflet/dist/leaflet.css";
import type { LeafletMouseEvent, Map as MapaLeaflet, Marker } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { ATRIBUCION, CENTRO_IQUIQUE, HTML_MARCADOR, TESELAS, buscarDireccion } from "@/lib/mapa";

type Punto = { lat: number; lng: number } | null;
const redondear = (n: number) => Math.round(n * 1e6) / 1e6;

// Ubicación de la propiedad en el formulario (spec 8): clic o arrastre para marcar, "Ubicar por
// dirección" (Nominatim con la dirección y la comuna del formulario) y "Quitar ubicación".
// Escribe en los inputs ocultos lat/lng, que se guardan con el resto del formulario.
export function MapaSelector({ lat, lng, error }: { lat: string; lng: string; error?: string }) {
  const inicial: Punto = lat && lng ? { lat: Number(lat), lng: Number(lng) } : null;
  const [punto, setPunto] = useState<Punto>(inicial);
  const [aviso, setAviso] = useState<string>();
  const [buscando, setBuscando] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const marcador = useRef<Marker | null>(null);
  const leaflet = useRef<typeof import("leaflet") | null>(null);

  // Crea el mapa una vez; el marcador se sincroniza con `punto` en el efecto de abajo.
  useEffect(() => {
    let vivo = true;
    import("leaflet").then((L) => {
      if (!vivo || !contenedor.current || mapa.current) return;
      leaflet.current = L;
      const m = L.map(contenedor.current, { scrollWheelZoom: false }).setView(
        inicial ? [inicial.lat, inicial.lng] : CENTRO_IQUIQUE,
        inicial ? 16 : 13,
      );
      L.tileLayer(TESELAS, { attribution: ATRIBUCION, maxZoom: 19 }).addTo(m);
      m.on("click", (e: LeafletMouseEvent) => setPunto({ lat: redondear(e.latlng.lat), lng: redondear(e.latlng.lng) }));
      mapa.current = m;
      setPunto((p) => (p ? { ...p } : p)); // dibuja el marcador inicial
    });
    return () => {
      vivo = false;
      mapa.current?.remove();
      mapa.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar
  }, []);

  useEffect(() => {
    const L = leaflet.current;
    const m = mapa.current;
    if (!L || !m) return;
    if (!punto) {
      marcador.current?.remove();
      marcador.current = null;
      return;
    }
    if (!marcador.current) {
      const icono = L.divIcon({ html: HTML_MARCADOR, className: "", iconSize: [22, 22], iconAnchor: [11, 22] });
      marcador.current = L.marker([punto.lat, punto.lng], { draggable: true, icon: icono, title: "Ubicación de la propiedad" }).addTo(m);
      marcador.current.on("dragend", () => {
        const { lat, lng } = marcador.current!.getLatLng();
        setPunto({ lat: redondear(lat), lng: redondear(lng) });
      });
    } else {
      marcador.current.setLatLng([punto.lat, punto.lng]);
    }
  }, [punto]);

  async function ubicarPorDireccion(boton: HTMLButtonElement) {
    const form = boton.form!;
    const valor = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | null)?.value.trim() ?? "";
    const texto = [valor("direccion"), valor("comuna"), "Chile"].filter(Boolean).join(", ");
    if (!valor("direccion")) return setAviso("Escribe la dirección para buscarla.");
    setBuscando(true);
    setAviso(undefined);
    try {
      const r = await buscarDireccion(texto);
      if (!r) return setAviso("No encontramos esa dirección. Marca el punto en el mapa.");
      setPunto({ lat: redondear(r.lat), lng: redondear(r.lng) });
      mapa.current?.setView([r.lat, r.lng], 17);
    } catch {
      setAviso("No se pudo buscar la dirección. Marca el punto en el mapa.");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="text-sm text-tinta">Ubicación en el mapa</span>
      <input type="hidden" name="lat" value={punto?.lat ?? ""} />
      <input type="hidden" name="lng" value={punto?.lng ?? ""} />
      <div ref={contenedor} className="z-0 h-72 w-full rounded-md border border-marino/20" aria-label="Mapa para marcar la ubicación" role="application" />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button type="button" disabled={buscando} onClick={(e) => ubicarPorDireccion(e.currentTarget)} className="rounded-md border border-marino/20 bg-white px-3 py-1.5 hover:border-marino disabled:opacity-50">
          {buscando ? "Buscando…" : "Ubicar por dirección"}
        </button>
        {punto && (
          <button type="button" onClick={() => setPunto(null)} className="text-red-700 hover:underline">
            Quitar ubicación
          </button>
        )}
        <span className="text-xs text-tinta/60">
          {punto ? "Puedes arrastrar el marcador para ajustarlo." : "Haz clic en el mapa para marcar la ubicación."}
        </span>
      </div>
      {(aviso || error) && (
        <p role="alert" className="text-xs text-red-700">
          {aviso ?? error}
        </p>
      )}
    </div>
  );
}
