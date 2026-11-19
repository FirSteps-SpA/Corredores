// Slugs para las URLs de las propiedades: /propiedades/casa-en-cavancha-3d-2b

const LARGO_MAXIMO = 80;

// Minúsculas, sin tildes, todo lo que no sea letra o dígito pasa a guion.
// Coincide con el `check` de la tabla: ^[a-z0-9]+(-[a-z0-9]+)*$ (o vacío si no hay letras ni dígitos).
export function slugDe(texto: string): string {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, LARGO_MAXIMO)
    .replace(/^-+|-+$/g, "");
}

// Primer slug libre: la base, o base-2, base-3…
export function slugLibre(base: string, usados: Iterable<string>): string {
  const ocupados = new Set(usados);
  if (!ocupados.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidato = `${base}-${n}`;
    if (!ocupados.has(candidato)) return candidato;
  }
}

// Minúsculas y sin diacríticos (á → a, ñ → n). También sirve para buscar sin tildes.
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
