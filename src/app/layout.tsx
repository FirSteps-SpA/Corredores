import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { SITIO_URL } from "@/lib/contacto";
import { DESCRIPCION_SITIO, IMAGEN_MARCA } from "@/lib/seo";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// metadataBase hace absolutas las URL de imágenes y canónicas (cambia con NEXT_PUBLIC_SITE_URL).
export const metadata: Metadata = {
  metadataBase: new URL(SITIO_URL),
  title: { default: "GyCmar Propiedades Iquique", template: "%s · GyCmar Propiedades Iquique" },
  description: DESCRIPCION_SITIO,
  openGraph: {
    siteName: "GyCmar Propiedades Iquique",
    locale: "es_CL",
    type: "website",
    images: [IMAGEN_MARCA],
  },
  twitter: { card: "summary_large_image", images: [IMAGEN_MARCA.url] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-CL"
      className={`${cormorant.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
