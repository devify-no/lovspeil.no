import { describe, it, expect } from "vitest";
import { SITEMAP_SECTION_CHUNK } from "@/lib/sitemap";
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
});
