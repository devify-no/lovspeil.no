import { describe, it, expect } from "vitest";
import {
  generateDocumentMetadata,
  generateSectionMetadata,
  documentIntroText,
  sectionIntroText,
} from "@/lib/seo/metadata";
import type { LegalDocument, LegalNode } from "@/db/schema";

const lawDoc = {
  id: "1",
  sourceType: "nl",
  documentKey: "lov/1997-06-13-44",
  lovdataId: "LOV-1997-06-13-44",
  title: "Lov om aksjeselskaper (aksjeloven)",
  shortTitle: "aksjeloven",
  abbreviation: null,
  slug: "aksjeloven",
  type: "law",
  date: "1997-06-13",
  number: "44",
  ministry: "Nærings- og fiskeridepartementet",
  status: "1999-01-01",
  rawXmlPath: "data/nl/nl-19970613-044.xml",
  sourceUpdatedAt: null,
  importedAt: new Date("2024-01-01"),
  canonicalLovdataUrl: "https://lovdata.no/lov/1997-06-13-44",
  legalCitationForms: [],
  legalAreas: [],
  language: "nb",
  searchVector: null,
} satisfies LegalDocument;

const sectionNode = {
  id: "2",
  documentId: "1",
  parentId: null,
  nodeType: "section",
  number: "§ 3-4",
  title: "Krav om forsvarlig egenkapital og likviditet",
  plainText: "",
  html: "<p>test</p>",
  order: 1,
  anchor: "paragraf-3-4",
  slugPath: "3-4",
  normalizedSectionNumber: "3-4",
  lovdataUrl: null,
  searchVector: null,
} satisfies LegalNode;

describe("generateDocumentMetadata", () => {
  it("creates law document title and description", () => {
    const meta = generateDocumentMetadata(lawDoc, "law");
    expect(meta.title).toBe(
      "Aksjeloven – Lov om aksjeselskaper (aksjeloven)"
    );
    expect(meta.description).toContain("aksjeloven");
    expect(meta.description).toContain("Lovdata");
    expect(meta.alternates?.canonical).toBe("/lover/aksjeloven");
    expect(meta.openGraph?.url).toBe("https://lovspeil.no/lover/aksjeloven");
  });
});

describe("generateSectionMetadata", () => {
  it("creates section title with section heading", () => {
    const meta = generateSectionMetadata(
      lawDoc,
      sectionNode,
      "law",
      "3-4"
    );
    expect(meta.title).toBe(
      "Aksjeloven § 3-4 – Krav om forsvarlig egenkapital og likviditet"
    );
    expect(meta.description).toContain("§ 3-4");
    expect(meta.description).toContain("forsvarlig egenkapital");
    expect(meta.alternates?.canonical).toBe("/lover/aksjeloven/3-4");
  });

  it("creates fallback description without section title", () => {
    const node = { ...sectionNode, title: null, number: "§ 11" };
    const meta = generateSectionMetadata(lawDoc, node, "law", "11");
    expect(meta.description).toBe(
      "Les Aksjeloven § 11. Se lovtekst, kapittel, relaterte bestemmelser og kilde til Lovdata."
    );
  });
});

describe("intro text", () => {
  it("generates document intro", () => {
    expect(documentIntroText(lawDoc)).toContain(lawDoc.title);
    expect(documentIntroText(lawDoc)).toContain("brukervennlig struktur");
  });

  it("generates section intro", () => {
    expect(sectionIntroText(lawDoc, "3-4")).toContain("aksjeloven § 3-4");
  });
});
