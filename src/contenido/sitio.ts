// Textos e imágenes institucionales del sitio público, en un solo lugar para reemplazarlos sin
// tocar las páginas. Lo marcado PROVISORIO viene del mockup y espera el texto del cliente
// (revisión obligatoria antes del lanzamiento, spec 9).

export const NOMBRE = "GyCmar Propiedades Iquique";
export const CIUDAD = "Iquique, Chile";
export const LEMA_PIE = "Confianza que construye patrimonio.";

export const hero = {
  titulo: "Tu propiedad.",
  tituloEnfasis: "Nuestro compromiso.",
  bajada: "Compra • Vende • Arrienda",
  // PROVISORIO: foto de la costa de Iquique del cliente (ruta en /public). null → fondo de marca.
  imagen: null as string | null,
};

// PROVISORIO: textos del mockup.
export const valores = {
  rotulo: "¿Por qué elegir GyCmar?",
  titulo: "Experiencia y cercanía",
  tituloEnfasis: "en el corazón de Iquique.",
  lista: [
    { icono: "trato", texto: "Atención personalizada" },
    { icono: "casa", texto: "Asesoría integral en todo el proceso" },
    { icono: "escudo", texto: "Transparencia y confianza" },
    { icono: "ubicacion", texto: "Conocimiento del mercado local" },
  ],
} as const;

// PROVISORIO: texto del mockup.
export const sobreNosotros = {
  rotulo: "Sobre nosotros",
  titulo: "Somos GyCmar Propiedades",
  resumen:
    "Una corredora de propiedades en Iquique, comprometida con ayudarte a encontrar el hogar o inversión ideal, con un servicio profesional, cercano y confiable.",
  // PROVISORIO: historia y equipo para la página Nosotros.
  parrafos: [
    "Una corredora de propiedades en Iquique, comprometida con ayudarte a encontrar el hogar o inversión ideal, con un servicio profesional, cercano y confiable.",
    "Acompañamos a cada cliente en todo el proceso: desde la primera visita hasta la firma, con información clara y atención directa.",
  ],
  imagen: null as string | null,
};

// PROVISORIO: servicios a confirmar con el cliente.
export const servicios = [
  { titulo: "Venta de propiedades", texto: "Publicamos y promovemos tu propiedad, coordinamos visitas y te acompañamos hasta la firma." },
  { titulo: "Arriendo", texto: "Buscamos arrendatarios, revisamos antecedentes y gestionamos el contrato." },
  { titulo: "Compra", texto: "Te ayudamos a encontrar la propiedad que buscas en Iquique y Alto Hospicio." },
  { titulo: "Asesoría", texto: "Orientación sobre precios de mercado, documentación y pasos del proceso." },
];

export const hablamos = {
  titulo: "¿Hablamos?",
  texto: "Estamos aquí para resolver tus dudas y acompañarte en cada paso.",
};

// Rangos del buscador del inicio. valor: "operacion:MONEDA:desde:hasta" (hasta vacío = sin tope).
// PROVISORIO: ajustar con la corredora según su catálogo.
export const rangosBuscador = [
  {
    grupo: "Venta",
    opciones: [
      { valor: "venta:UF:0:3000", texto: "Hasta UF 3.000" },
      { valor: "venta:UF:3000:5000", texto: "UF 3.000 – 5.000" },
      { valor: "venta:UF:5000:8000", texto: "UF 5.000 – 8.000" },
      { valor: "venta:UF:8000:", texto: "Más de UF 8.000" },
    ],
  },
  {
    grupo: "Arriendo",
    opciones: [
      { valor: "arriendo:CLP:0:400000", texto: "Hasta $400.000" },
      { valor: "arriendo:CLP:400000:700000", texto: "$400.000 – $700.000" },
      { valor: "arriendo:CLP:700000:1000000", texto: "$700.000 – $1.000.000" },
      { valor: "arriendo:CLP:1000000:", texto: "Más de $1.000.000" },
    ],
  },
];
