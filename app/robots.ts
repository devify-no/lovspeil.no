import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lovspeil.no";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dev/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
