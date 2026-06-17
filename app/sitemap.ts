import type { MetadataRoute } from "next";
import { getAllDocuments, getAllSectionPaths } from "@/lib/queries";
import { buildDocumentUrl } from "@/lib/lovdata/slug";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lovspeil.no";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/lover`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/forskrifter`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/sok`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/om`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/kilde-og-lisens`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const laws = await getAllDocuments("law");
    const regulations = await getAllDocuments("regulation");
    const sections = await getAllSectionPaths();

    const docPages: MetadataRoute.Sitemap = [
      ...laws.map((doc) => ({
        url: `${baseUrl}${buildDocumentUrl("law", doc.slug)}`,
        lastModified: doc.importedAt ?? new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
      ...regulations.map((doc) => ({
        url: `${baseUrl}${buildDocumentUrl("regulation", doc.slug)}`,
        lastModified: doc.importedAt ?? new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ];

    const sectionPages: MetadataRoute.Sitemap = sections
      .filter((s) => s.sectionSlug)
      .map((s) => ({
        url: `${baseUrl}${buildDocumentUrl(
          s.docType as "law" | "regulation",
          s.docSlug,
          s.sectionSlug!
        )}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));

    return [...staticPages, ...docPages, ...sectionPages];
  } catch {
    return staticPages;
  }
}
