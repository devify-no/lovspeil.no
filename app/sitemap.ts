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
  id: Promise<number>;
}): Promise<MetadataRoute.Sitemap> {
  const id = await props.id;
  const baseUrl = getSiteBaseUrl();

  try {
    if (id === 0) {
      return buildCoreSitemap(baseUrl);
    }
    return buildSectionSitemapChunk(baseUrl, id - 1);
  } catch {
    return id === 0 ? [] : [];
  }
}
