import { describe, it, expect } from "vitest";
import {
  slugify,
  normalizeSectionNumber,
  generateDocumentSlug,
  extractShortTitle,
  buildDocumentUrl,
  canonicalDocumentKey,
  cleanDocumentTitle,
  normalizeAlias,
  parseLovdataDate,
} from "@/lib/lovdata/slug";

describe("slugify", () => {
  it("creates URL-safe slugs", () => {
    expect(slugify("Aksjeloven")).toBe("aksjeloven");
    expect(slugify("Lov om aksjeselskaper")).toBe("lov-om-aksjeselskaper");
  });

  it("handles Norwegian characters", () => {
    expect(slugify("Offentleglova")).toBe("offentleglova");
    expect(normalizeAlias("Arbeidsmiljøloven")).toBe("arbeidsmiljoloven");
  });
});

describe("extractShortTitle", () => {
  it("extracts parenthetical short title", () => {
    const result = extractShortTitle("Lov om aksjeselskaper (aksjeloven)");
    expect(result.shortTitle).toBe("aksjeloven");
    expect(result.mainTitle).toBe("Lov om aksjeselskaper");
  });

  it("extracts bracket short title", () => {
    const result = extractShortTitle("Lov om petroleumsvirksomhet [petroleumsloven]");
    expect(result.shortTitle).toBe("petroleumsloven");
  });
});

describe("generateDocumentSlug", () => {
  it("prefers shortTitle", () => {
    const slug = generateDocumentSlug(
      "Lov om aksjeselskaper (aksjeloven)",
      "lov/1997-06-13-44",
      new Set()
    );
    expect(slug).toBe("aksjeloven");
  });

  it("appends key suffix on collision", () => {
    const existing = new Set(["aksjeloven"]);
    const slug = generateDocumentSlug(
      "Lov om aksjeselskaper (aksjeloven)",
      "lov/1997-06-13-44",
      existing
    );
    expect(slug).not.toBe("aksjeloven");
    expect(slug).toContain("aksjeloven");
  });

  it("never embeds path separators from legacy sf/ keys", () => {
    const slug = generateDocumentSlug(
      "Forskrift om forurensning og avfall på Svalbard",
      "sf/forskrift/2020-07-03-1517",
      new Set(["forskrift-om-forurensning-og-avfall-pa-svalbard"])
    );
    expect(slug).not.toContain("/");
    expect(slug).toBe(
      "forskrift-om-forurensning-og-avfall-pa-svalbard-2020-07-03-1517"
    );
  });

  it("handles HTML tags in scientific names", () => {
    const erwinia = generateDocumentSlug(
      "Forskrift om kontrollområder for å forebygge, begrense og bekjempe pærebrann (<i>Erwinia amylovora</i>)",
      "forskrift/2020-01-08-51",
      new Set()
    );
    expect(erwinia).toBe("erwinia-amylovora");

    const villrein = generateDocumentSlug(
      "Kvalitetsnorm for villrein (<i>Rangifer tarandus</i>)",
      "forskrift/2020-06-23-1298",
      new Set()
    );
    expect(villrein).toBe("kvalitetsnorm-for-villrein");
  });
});

describe("normalizeSectionNumber", () => {
  it("normalizes § references", () => {
    expect(normalizeSectionNumber("§1-1")).toBe("1-1");
    expect(normalizeSectionNumber("§11")).toBe("11");
    expect(normalizeSectionNumber("§1-5 a")).toBe("1-5-a");
    expect(normalizeSectionNumber("§ 3-1")).toBe("3-1");
  });

  it("returns null for empty input", () => {
    expect(normalizeSectionNumber(null)).toBeNull();
    expect(normalizeSectionNumber("")).toBeNull();
  });

  it("ignores chapter data-name markers", () => {
    expect(normalizeSectionNumber("kap1")).toBeNull();
    expect(normalizeSectionNumber("kapI")).toBeNull();
    expect(normalizeSectionNumber("KAPITTEL_1")).toBeNull();
  });
});

describe("parseLovdataDate", () => {
  it("parses ISO dates", () => {
    expect(parseLovdataDate("2024-06-12")?.toISOString().slice(0, 10)).toBe(
      "2024-06-12"
    );
  });

  it("extracts date from parenthetical notes", () => {
    expect(parseLovdataDate("§ 12 nr. 4 (2008-01-21)")?.toISOString().slice(0, 10)).toBe(
      "2008-01-21"
    );
  });

  it("returns null for free-text lastupdated", () => {
    expect(parseLovdataDate("Justering av tittel jf. LT-kunngj.")).toBeNull();
  });
});

describe("cleanDocumentTitle", () => {
  it("strips html tags from titles", () => {
    expect(
      cleanDocumentTitle(
        "Kvalitetsnorm for villrein (<i>Rangifer tarandus</i>)"
      )
    ).toBe("Kvalitetsnorm for villrein (Rangifer tarandus)");
  });
});

describe("canonicalDocumentKey", () => {
  it("strips SF/ prefix from forskrift keys", () => {
    expect(canonicalDocumentKey("sf/forskrift/1997-01-10-16")).toBe(
      "forskrift/1997-01-10-16"
    );
  });

  it("leaves lov keys unchanged", () => {
    expect(canonicalDocumentKey("lov/1997-06-13-44")).toBe("lov/1997-06-13-44");
  });
});

describe("buildDocumentUrl", () => {
  it("builds law URLs", () => {
    expect(buildDocumentUrl("law", "aksjeloven")).toBe("/lover/aksjeloven");
    expect(buildDocumentUrl("law", "aksjeloven", "3-1")).toBe(
      "/lover/aksjeloven/3-1"
    );
  });

  it("builds regulation URLs", () => {
    expect(buildDocumentUrl("regulation", "gravplassforskriften")).toBe(
      "/forskrifter/gravplassforskriften"
    );
  });
});
