// Filtros, orden y paginación del listado público. Lógica pura sobre el listado cacheado (spec 6):
// la URL es la fuente de verdad (se comparte y funciona sin JavaScript).

import { leerNumero } from "./esquema";
import { MONEDAS, OPERACIONES, TIPOS, type Moneda, type Operacion, type Tipo } from "./opciones";
import { disponible, ordenPublico } from "./orden";
import { normalizar } from "./slug";

export const POR_PAGINA = 12;

export const ORDENES = {
  relevantes: "Relevantes",
  "precio-asc": "Precio: menor a mayor",
  "precio-desc": "Precio: mayor a menor",
  recientes: "Más recientes",
} as const;
export type Orden = keyof typeof ORDENES;

export type Filtros = {
  operacion?: Operacion;
  tipo?: Tipo;
  comuna?: string;
  sector?: string;
  desde?: number;
  hasta?: number;
  moneda: Moneda;
  dormitorios?: number;
  banos?: number;
  disponibles: boolean;
  orden: Orden;
  pagina: number;
};

type Filtrable = {
  operacion: string;
  tipo: string;
  comuna: string;
  sector: string | null;
  precio: number;
  moneda: string;
  dormitorios: number | null;
  banos: number | null;
  estado: string;
  destacada: boolean;
  updated_at: string;
};

type Params = Record<string, string | string[] | undefined>;

const de = <T extends object>(o: T, v?: string) => (v && v in o ? (v as keyof T) : undefined);
const cantidad = (v?: string) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 20 ? n : undefined;
};
const monto = (v?: string) => {
  const n = v ? leerNumero(v) : null;
  return n !== null && Number.isFinite(n) && n >= 0 ? n : undefined;
};
const texto = (v?: string) => v?.trim().slice(0, 80) || undefined;

// `rango` viene del buscador del inicio: "operacion:MONEDA:desde:hasta" (hasta vacío = sin tope).
function leerRango(v?: string): Partial<Filtros> {
  const [op, mon, desde, hasta] = (v ?? "").split(":");
  const operacion = de(OPERACIONES, op);
  const moneda = de(MONEDAS, mon);
  if (!operacion || !moneda) return {};
  return { operacion, moneda, desde: monto(desde) || undefined, hasta: monto(hasta) };
}

export function leerFiltros(params: Params): Filtros {
  const p = (k: string) => {
    const v = params[k];
    return typeof v === "string" ? v : undefined;
  };
  const rango = leerRango(p("rango"));
  const operacion = de(OPERACIONES, p("operacion")) ?? rango.operacion;
  return {
    operacion,
    tipo: de(TIPOS, p("tipo")),
    comuna: texto(p("comuna")),
    sector: texto(p("sector")),
    desde: monto(p("desde")) ?? rango.desde,
    hasta: monto(p("hasta")) ?? rango.hasta,
    moneda: de(MONEDAS, p("moneda")) ?? rango.moneda ?? (operacion === "arriendo" ? "CLP" : "UF"),
    dormitorios: cantidad(p("dormitorios")),
    banos: cantidad(p("banos")),
    disponibles: p("disponibles") === "1",
    orden: de(ORDENES, p("orden")) ?? "relevantes",
    pagina: Math.max(1, Math.floor(Number(p("pagina")) || 1)),
  };
}

// Parámetros de URL para unos filtros (solo lo que no es por defecto). Para enlaces de paginación.
export function aParams(f: Filtros, cambios: Partial<Filtros> = {}): string {
  const x = { ...f, ...cambios };
  const u = new URLSearchParams();
  const poner = (k: string, v: unknown) => v !== undefined && v !== false && v !== "" && u.set(k, String(v));
  poner("operacion", x.operacion);
  poner("tipo", x.tipo);
  poner("comuna", x.comuna);
  poner("sector", x.sector);
  poner("desde", x.desde);
  poner("hasta", x.hasta);
  if (x.desde !== undefined || x.hasta !== undefined) poner("moneda", x.moneda);
  poner("dormitorios", x.dormitorios);
  poner("banos", x.banos);
  if (x.disponibles) u.set("disponibles", "1");
  if (x.orden !== "relevantes") u.set("orden", x.orden);
  if (x.pagina > 1) u.set("pagina", String(x.pagina));
  return u.size ? `?${u}` : "";
}

export const hayFiltros = (f: Filtros) =>
  !!(f.operacion || f.tipo || f.comuna || f.sector || f.desde !== undefined || f.hasta !== undefined ||
    f.dormitorios || f.banos || f.disponibles);

// Precio en otra moneda con el valor de la UF; sin UF (null) no se puede convertir.
export function enMoneda(precio: number, desde: string, hacia: Moneda, uf: number | null): number | null {
  if (desde === hacia) return precio;
  if (!uf) return null;
  return hacia === "UF" ? precio / uf : precio * uf;
}

export function filtrar<T extends Filtrable>(lista: T[], f: Filtros, uf: number | null): T[] {
  const igual = (a: string | null, b?: string) => !b || (a !== null && normalizar(a) === normalizar(b));
  return lista.filter((p) => {
    if (f.operacion && p.operacion !== f.operacion) return false;
    if (f.tipo && p.tipo !== f.tipo) return false;
    if (!igual(p.comuna, f.comuna) || !igual(p.sector, f.sector)) return false;
    if (f.disponibles && !disponible(p)) return false;
    if (f.dormitorios && (p.dormitorios ?? -1) < f.dormitorios) return false;
    if (f.banos && (p.banos ?? -1) < f.banos) return false;
    if (f.desde !== undefined || f.hasta !== undefined) {
      const v = enMoneda(p.precio, p.moneda, f.moneda, uf);
      if (v === null) return false;
      if (f.desde !== undefined && v < f.desde) return false;
      if (f.hasta !== undefined && v > f.hasta) return false;
    }
    return true;
  });
}

// Cerradas (vendidas, arrendadas) siempre al final. En el orden por precio, sin UF, las de la otra
// moneda van después de las de la moneda de los filtros.
export function ordenar<T extends Filtrable>(lista: T[], orden: Orden, moneda: Moneda, uf: number | null): T[] {
  if (orden === "relevantes") return ordenPublico(lista);
  const clave = (p: T) => {
    if (orden === "recientes") return -Date.parse(p.updated_at);
    const v = enMoneda(p.precio, p.moneda, moneda, uf);
    if (v === null) return Infinity;
    return orden === "precio-asc" ? v : -v;
  };
  return lista.toSorted((a, b) => Number(disponible(b)) - Number(disponible(a)) || clave(a) - clave(b));
}

export function paginar<T>(lista: T[], pagina: number, porPagina = POR_PAGINA) {
  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const actual = Math.min(Math.max(1, pagina), totalPaginas);
  return {
    items: lista.slice((actual - 1) * porPagina, actual * porPagina),
    pagina: actual,
    totalPaginas,
    total: lista.length,
  };
}

// Comunas y sectores con propiedades visibles, sin repetir (sin distinguir tildes) y ordenados.
export function opcionesDe(lista: { comuna: string; sector: string | null }[]) {
  const unicos = (valores: (string | null)[]) => {
    const vistos = new Map<string, string>();
    for (const v of valores) if (v && !vistos.has(normalizar(v))) vistos.set(normalizar(v), v);
    return [...vistos.values()].sort((a, b) => a.localeCompare(b, "es"));
  };
  return { comunas: unicos(lista.map((p) => p.comuna)), sectores: unicos(lista.map((p) => p.sector)) };
}
