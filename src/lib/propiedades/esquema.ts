import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";
import { ESTADOS, MONEDAS, OPERACIONES, TIPOS, claves } from "./opciones";
import { slugDe } from "./slug";

export type PropiedadFila = Database["public"]["Tables"]["propiedades"]["Insert"];

// Campos de texto del formulario, para devolverlos tal cual si hay errores
// (React 19 vacía el formulario tras la acción).
export type Valores = Record<string, string | string[]>;
export type Errores = Partial<Record<string, string>>;

export type Resultado =
  | { ok: true; datos: Omit<PropiedadFila, "id" | "created_at" | "updated_at">; valores: Valores }
  | { ok: false; errores: Errores; valores: Valores };

// Número en formato chileno: "350.000" → 350000, "4.500,5" → 4500.5, "4,5" → 4.5.
// Sin coma, un punto es de miles solo si separa grupos de 3 ("4.500"); si no, es decimal ("4.5").
export function leerNumero(texto: string): number | null {
  let t = texto.trim().replace(/\s/g, "").replace(/^\$/, "");
  if (t === "") return null;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
}

const texto = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres.`);
const opcional = (max: number) => texto(max).transform((v) => (v === "" ? null : v));
const obligatorio = (max: number, mensaje: string) => texto(max).min(1, mensaje);

const numero = (opciones: { obligatorio?: boolean; entero?: boolean } = {}) =>
  z
    .string()
    .transform((v, ctx) => {
      const n = leerNumero(v);
      if (n === null) {
        if (opciones.obligatorio) ctx.addIssue({ code: "custom", message: "Obligatorio." });
        return null;
      }
      if (Number.isNaN(n)) {
        ctx.addIssue({ code: "custom", message: "Debe ser un número." });
        return z.NEVER;
      }
      if (n < 0) ctx.addIssue({ code: "custom", message: "No puede ser negativo." });
      if (opciones.entero && !Number.isInteger(n))
        ctx.addIssue({ code: "custom", message: "Debe ser un número entero." });
      return n;
    });

const lista = <T extends object>(o: T, mensaje: string) => z.enum(claves(o), { error: mensaje });

const esquema = z
  .object({
    titulo: obligatorio(150, "El título es obligatorio."),
    slug: texto(200),
    codigo: opcional(30),
    descripcion: opcional(5000),
    operacion: lista(OPERACIONES, "Elige venta o arriendo."),
    tipo: lista(TIPOS, "Elige un tipo."),
    precio: numero({ obligatorio: true }),
    moneda: lista(MONEDAS, "Elige UF o pesos."),
    gastos_comunes: numero(),
    region: opcional(80),
    comuna: obligatorio(80, "La comuna es obligatoria."),
    sector: opcional(80),
    direccion: opcional(200),
    mostrar_direccion: z.boolean(),
    dormitorios: numero({ entero: true }),
    banos: numero({ entero: true }),
    estacionamientos: numero({ entero: true }),
    bodegas: numero({ entero: true }),
    m2_utiles: numero(),
    m2_totales: numero(),
    caracteristicas: z.array(z.string()).max(30, "Máximo 30 características."),
    estado: lista(ESTADOS, "Elige un estado."),
    destacada: z.boolean(),
  })
  .superRefine((p, ctx) => {
    if (p.moneda === "CLP" && p.precio !== null && !Number.isInteger(p.precio))
      ctx.addIssue({ code: "custom", path: ["precio"], message: "Un precio en pesos no lleva decimales." });
    if (!slugDe(p.slug || p.titulo))
      ctx.addIssue({ code: "custom", path: ["slug"], message: "Debe tener letras o números." });
  })
  .transform(({ slug, precio, ...p }) => ({ ...p, slug: slugDe(slug || p.titulo), precio: precio! }));

// Características: las marcadas más las escritas en "otras" (separadas por coma), sin repetir.
function leerCaracteristicas(form: FormData): string[] {
  const otras = String(form.get("caracteristicas_otras") ?? "").split(",");
  const vistas = new Set<string>();
  return [...form.getAll("caracteristicas").map(String), ...otras]
    .map((c) => c.trim().replace(/\s+/g, " "))
    .filter((c) => c && !vistas.has(c.toLowerCase()) && vistas.add(c.toLowerCase()));
}

const CAMPOS_TEXTO = [
  "titulo", "slug", "codigo", "descripcion", "operacion", "tipo", "precio", "moneda", "gastos_comunes",
  "region", "comuna", "sector", "direccion", "dormitorios", "banos", "estacionamientos", "bodegas",
  "m2_utiles", "m2_totales", "estado", "caracteristicas_otras",
] as const;

export function leerPropiedad(form: FormData): Resultado {
  const valores: Valores = {};
  for (const c of CAMPOS_TEXTO) valores[c] = String(form.get(c) ?? "");
  valores.caracteristicas = form.getAll("caracteristicas").map(String);
  for (const c of ["mostrar_direccion", "destacada"]) valores[c] = form.get(c) === "on" ? "on" : "";

  const r = esquema.safeParse({
    ...valores,
    mostrar_direccion: valores.mostrar_direccion === "on",
    destacada: valores.destacada === "on",
    caracteristicas: leerCaracteristicas(form),
  });
  if (r.success) return { ok: true, datos: r.data, valores };

  const errores: Errores = {};
  for (const issue of r.error.issues) {
    const campo = String(issue.path[0] ?? "formulario");
    errores[campo] ??= issue.message;
  }
  return { ok: false, errores, valores };
}
