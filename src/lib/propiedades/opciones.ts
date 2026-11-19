// Valores y etiquetas del formulario y del listado. Las listas cerradas coinciden con los
// `check` de la tabla `propiedades` (supabase/migrations/20261119000000_esquema.sql).

export const OPERACIONES = { venta: "Venta", arriendo: "Arriendo" } as const;

export const TIPOS = {
  casa: "Casa",
  departamento: "Departamento",
  oficina: "Oficina",
  local: "Local comercial",
  terreno: "Terreno",
  parcela: "Parcela",
  bodega: "Bodega",
} as const;

export const MONEDAS = { UF: "UF", CLP: "Pesos ($)" } as const;

export const ESTADOS = {
  borrador: "Borrador",
  publicada: "Publicada",
  reservada: "Reservada",
  vendida: "Vendida",
  arrendada: "Arrendada",
} as const;

export type Operacion = keyof typeof OPERACIONES;
export type Tipo = keyof typeof TIPOS;
export type Moneda = keyof typeof MONEDAS;
export type Estado = keyof typeof ESTADOS;

export const claves = <T extends object>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];

// Sugerencias: se pueden agregar otras en el formulario.
export const CARACTERISTICAS = [
  "piscina",
  "quincho",
  "terraza",
  "vista al mar",
  "amoblado",
  "acepta mascotas",
  "ascensor",
  "conserjería",
  "estacionamiento de visitas",
  "bodega",
];

// Comunas de la región de Tarapacá, como sugerencias del campo comuna (texto libre).
export const COMUNAS = ["Iquique", "Alto Hospicio", "Pozo Almonte", "Pica", "Huara", "Camiña", "Colchane"];

export const REGION_POR_DEFECTO = "Tarapacá";
export const COMUNA_POR_DEFECTO = "Iquique";
