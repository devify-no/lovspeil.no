import type { MetadataRoute } from "next";
import {
  buildCoreSitemap,
  buildSectionSitemapChunk,
  generateSitemapIds,
  getSiteBaseUrl,
} from "@/lib/sitemap";

export const revalidate = 86400;

export async function generateSitemaps() {
  return generateSitemapIds();
}

export default async function sitemap(props: {
  id: Promise<string | number>;
}): Promise<MetadataRoute.Sitemap> {
  const rawId = await props.id;
  const id = typeof rawId === "string" ? Number.parseInt(rawId, 10) : rawId;
  const baseUrl = getSiteBaseUrl();

  if (id === 0) {
    return buildCoreSitemap(baseUrl);
  }
  if (!Number.isFinite(id) || id < 1) {
    return [];
  }
  return buildSectionSitemapChunk(baseUrl, id - 1);
}
