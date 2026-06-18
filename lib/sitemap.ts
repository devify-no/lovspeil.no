import type { MetadataRoute } from "next";
import {
  getAllDocuments,
  getSectionPathCount,
  getSectionPathsPage,
} from "@/lib/queries";
import { buildDocumentUrl } from "@/lib/lovdata/slug";
import { documentLastModified } from "@/lib/seo/urls";
import { getSiteUrl } from "@/lib/seo/site";

/** Google allows max 50 000 URLs per sitemap file. */
export const SITEMAP_SECTION_CHUNK = 45_000;

export async function generateSitemapIds() {
  try {
    const sectionCount = await getSectionPathCount();
    const sectionChunks = Math.ceil(sectionCount / SITEMAP_SECTION_CHUNK);
    const ids = [{ id: 0 }];
    for (let i = 0; i < sectionChunks; i++) {
      ids.push({ id: i + 1 });
    }
    return ids;
  } catch {
    return [{ id: 0 }];
  }
}

function corePages(baseUrl: string): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${baseUrl}/lover`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/forskrifter`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sok`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/om`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/kilde-og-lisens`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}

export async function buildCoreSitemap(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const laws = await getAllDocuments("law");
  const regulations = await getAllDocuments("regulation");

  const docPages: MetadataRoute.Sitemap = [
    ...laws.map((doc) => ({
      url: `${baseUrl}${buildDocumentUrl("law", doc.slug)}`,
      lastModified: documentLastModified(doc),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...regulations.map((doc) => ({
      url: `${baseUrl}${buildDocumentUrl("regulation", doc.slug)}`,
      lastModified: documentLastModified(doc),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return [...corePages(baseUrl), ...docPages];
}

export async function buildSectionSitemapChunk(
  baseUrl: string,
  chunkIndex: number
): Promise<MetadataRoute.Sitemap> {
  if (chunkIndex < 0) return [];

  const offset = chunkIndex * SITEMAP_SECTION_CHUNK;
  const sections = await getSectionPathsPage(offset, SITEMAP_SECTION_CHUNK);

  return sections
    .filter((s) => s.sectionSlug)
    .map((s) => ({
      url: `${baseUrl}${buildDocumentUrl(
        s.docType as "law" | "regulation",
        s.docSlug,
        s.sectionSlug!
      )}`,
      lastModified: s.lastModified ?? undefined,
      changeFrequency: "monthly" as const,
      priority: s.docType === "law" ? 0.65 : 0.6,
    }));
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatLastMod(date: string | Date | undefined): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function buildSitemapUrlsetXml(entries: MetadataRoute.Sitemap): string {
  const urls = entries
    .map((entry) => {
      const lastmod = formatLastMod(entry.lastModified);
      return `
<url>
<loc>${escapeXml(entry.url)}</loc>${lastmod ? `\n<lastmod>${lastmod}</lastmod>` : ""}${entry.changeFrequency ? `\n<changefreq>${entry.changeFrequency}</changefreq>` : ""}${entry.priority != null ? `\n<priority>${entry.priority}</priority>` : ""}
</url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
}

export function parseSitemapId(rawId: string): number | null {
  const id = rawId.replace(/\.xml$/i, "");
  const parsed = Number.parseInt(id, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function buildSitemapChunkXml(
  baseUrl: string,
  id: number
): Promise<string | null> {
  if (id === 0) {
    return buildSitemapUrlsetXml(await buildCoreSitemap(baseUrl));
  }
  if (id < 1) return null;
  return buildSitemapUrlsetXml(
    await buildSectionSitemapChunk(baseUrl, id - 1)
  );
}

export function getSiteBaseUrl() {
  return getSiteUrl();
}

export async function buildSitemapIndexXml(baseUrl: string): Promise<string> {
  const ids = await generateSitemapIds();
  const entries = ids
    .map(
      ({ id }) => `
<sitemap>
<loc>${baseUrl}/sitemap/${id}.xml</loc>
</sitemap>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}
</sitemapindex>`;
}
