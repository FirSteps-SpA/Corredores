import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

// Fotos de propiedades en Supabase Storage, optimizadas por next/image (en Netlify, su CDN de
// imágenes). Con Supabase local (127.0.0.1) hay que permitir IPs locales: solo en ese caso.
const supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:55321");
const supabaseLocal = ["127.0.0.1", "localhost"].includes(supabase.hostname);

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Catálogo público: updateTag("propiedades") lo invalida al momento; esto lo renueva igual cada
  // 5 minutos por si la invalidación no llegara (ver design de la spec 5).
  cacheLife: {
    catalogo: { stale: 60, revalidate: 300, expire: 3600 },
  },
  images: {
    remotePatterns: [
      {
        protocol: supabase.protocol.replace(":", "") as "http" | "https",
        hostname: supabase.hostname,
        port: supabase.port,
        pathname: "/storage/v1/object/public/propiedades/**",
      },
    ],
    dangerouslyAllowLocalIP: supabaseLocal,
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withSentryConfig(nextConfig, {
  org: "first-steps",
  project: "corredores",
  // Source maps solo si hay token (build de producción en Netlify); sin token no se suben.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
