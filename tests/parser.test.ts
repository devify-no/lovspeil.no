import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { parseLovdataHtml, flattenNodes } from "@/lib/lovdata/parser";

const FIXTURES = join(process.cwd(), "tests/fixtures");

describe("parseLovdataHtml - NL (laws)", () => {
  it("parses aksjeloven", () => {
    const html = readFileSync(join(FIXTURES, "nl-19970613-044.xml"), "utf8");
    const result = parseLovdataHtml(html, {
      filePath: "data/nl/nl-19970613-044.xml",
      sourceType: "nl",
    });

    expect(result.meta.title).toContain("aksjeselskaper");
    expect(result.meta.slug).toBe("aksjeloven");
    expect(result.meta.type).toBe("law");
    expect(result.meta.ministry).toBeTruthy();
    expect(result.nodes.length).toBeGreaterThan(0);

    const flat = flattenNodes(result.nodes);
    const sections = flat.filter((n) => n.normalizedSectionNumber);
    expect(sections.some((s) => s.normalizedSectionNumber === "1-1")).toBe(true);
    expect(sections.some((s) => s.normalizedSectionNumber === "3-1")).toBe(true);
  });

  it("parses forvaltningsloven", () => {
    const html = readFileSync(join(FIXTURES, "nl-19670210-000.xml"), "utf8");
    const result = parseLovdataHtml(html, {
      filePath: "data/nl/nl-19670210-000.xml",
      sourceType: "nl",
    });

    expect(result.meta.title).toContain("forvaltningssaker");
    expect(result.meta.type).toBe("law");

    const flat = flattenNodes(result.nodes);
    const sections = flat.filter((n) => n.normalizedSectionNumber);
    expect(sections.some((s) => s.normalizedSectionNumber === "11")).toBe(true);
  });

  it("parses straffeloven", () => {
    const html = readFileSync(join(FIXTURES, "nl-20050520-028.xml"), "utf8");
    const result = parseLovdataHtml(html, {
      filePath: "data/nl/nl-20050520-028.xml",
      sourceType: "nl",
    });

    expect(result.meta.title.toLowerCase()).toContain("straff");
    expect(result.nodes.length).toBeGreaterThan(0);
  });
});

describe("parseLovdataHtml - SF (regulations)", () => {
  it("parses a forskrift", () => {
    const html = readFileSync(join(FIXTURES, "sf-19970110-0016.xml"), "utf8");
    const result = parseLovdataHtml(html, {
      filePath: "data/sf/sf-19970110-0016.xml",
      sourceType: "sf",
    });

    expect(result.meta.type).toBe("regulation");
    expect(result.meta.title).toBeTruthy();
    expect(result.meta.documentKey).toBe("forskrift/1997-01-10-16");
  });

  it("extracts explicit links", () => {
    const html = readFileSync(join(FIXTURES, "nl-19970613-044.xml"), "utf8");
    const result = parseLovdataHtml(html, {
      filePath: "data/nl/nl-19970613-044.xml",
      sourceType: "nl",
    });

    const lovLinks = result.explicitLinks.filter((l) => l.lovdataPath?.startsWith("lov/"));
    expect(lovLinks.length).toBeGreaterThan(0);
  });

  it("parses chapter 16 without inheriting nested section headers", () => {
    const html = readFileSync(join(FIXTURES, "nl-19970613-044.xml"), "utf8");
    const result = parseLovdataHtml(html, {
      filePath: "data/nl/nl-19970613-044.xml",
      sourceType: "nl",
    });

    const ch16 = result.nodes.find((n) => n.anchor === "kapittel-16");
    expect(ch16).toBeTruthy();
    expect(ch16!.number).toBe("16");
    expect(ch16!.title).toBe("Oppløsning og avvikling");

    const flat = flattenNodes(result.nodes);
    const s161 = flat.find((n) => n.normalizedSectionNumber === "16-1");
    expect(s161?.title).toBe("Beslutning om oppløsning");
    expect(s161?.number).toBe("§ 16-1");

    const subPart = flat.find((n) => n.anchor === "kapittel-16-kapittel-1");
    expect(subPart?.title).toMatch(/^I\./);
    expect(subPart?.number).not.toBe("§ 16-1");
  });
});
