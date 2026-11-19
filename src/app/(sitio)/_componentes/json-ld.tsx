import { jsonLdTexto } from "@/lib/seo";

// Datos estructurados para buscadores (schema.org), spec 7.
export function JsonLd({ datos }: { datos: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdTexto(datos) }} />;
}
