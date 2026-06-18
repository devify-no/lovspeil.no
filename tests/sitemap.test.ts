import { describe, it, expect } from "vitest";
import {
  SITEMAP_SECTION_CHUNK,
  buildSitemapIndexXml,
  buildSitemapUrlsetXml,
  parseSitemapId,
} from "@/lib/sitemap";
import { buildDocumentUrl } from "@/lib/lovdata/slug";

describe("sitemap configuration", () => {
  it("keeps section chunks below search engine limits", () => {
    expect(SITEMAP_SECTION_CHUNK).toBeLessThanOrEqual(45_000);
    expect(SITEMAP_SECTION_CHUNK).toBeLessThan(50_000);
  });

  it("builds canonical absolute-style paths for sitemap entries", () => {
    const baseUrl = "https://lovspeil.no";
    const lawDocUrl = `${baseUrl}${buildDocumentUrl("law", "aksjeloven")}`;
    const sectionUrl = `${baseUrl}${buildDocumentUrl("law", "aksjeloven", "3-4")}`;

    expect(lawDocUrl).toBe("https://lovspeil.no/lover/aksjeloven");
    expect(sectionUrl).toBe("https://lovspeil.no/lover/aksjeloven/3-4");
  });

  it("builds sitemap index XML linking to sub-sitemaps", async () => {
    const xml = await buildSitemapIndexXml("https://lovspeil.no");

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain("<loc>https://lovspeil.no/sitemap/0.xml</loc>");
  });

  it("parses sitemap id from route segment", () => {
    expect(parseSitemapId("0")).toBe(0);
    expect(parseSitemapId("0.xml")).toBe(0);
    expect(parseSitemapId("2.xml")).toBe(2);
    expect(parseSitemapId("bad")).toBeNull();
  });

  it("builds urlset XML with escaped URLs", () => {
    const xml = buildSitemapUrlsetXml([
      {
        url: "https://lovspeil.no/lover/aksjeloven",
        lastModified: new Date("2024-06-12"),
        changeFrequency: "monthly",
        priority: 0.8,
      },
    ]);

    expect(xml).toContain("<urlset");
    expect(xml).toContain("<loc>https://lovspeil.no/lover/aksjeloven</loc>");
    expect(xml).toContain("<lastmod>2024-06-12");
  });
});
