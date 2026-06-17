import { describe, it, expect } from "vitest";
import {
  slugify,
  normalizeSectionNumber,
  generateDocumentSlug,
  extractShortTitle,
  buildDocumentUrl,
  normalizeAlias,
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
