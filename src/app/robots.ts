import type { MetadataRoute } from "next";
import { urlAbsoluta } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: urlAbsoluta("/sitemap.xml"),
  };
}
