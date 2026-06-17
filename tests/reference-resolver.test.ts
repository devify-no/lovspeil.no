import { describe, it, expect } from "vitest";
import {
  resolveSameDocumentSection,
  parseSectionNumbersFromMatch,
  findDocumentByAlias,
  type ReferenceContext,
  type DocumentLookupEntry,
  type NodeLookupEntry,
  type AliasLookupEntry,
} from "@/lib/lovdata/reference-resolver";

function makeContext(overrides: Partial<ReferenceContext> = {}): ReferenceContext {
  const docId = "doc-1";
  const sections = new Map<string, NodeLookupEntry>([
    ["7", { id: "node-7", documentId: docId, normalizedSectionNumber: "7", anchor: "s7", slugPath: "7" }],
    ["9", { id: "node-9", documentId: docId, normalizedSectionNumber: "9", anchor: "s9", slugPath: "9" }],
    ["3-1", { id: "node-3-1", documentId: docId, normalizedSectionNumber: "3-1", anchor: "s3-1", slugPath: "3-1" }],
  ]);

  const aksjeDoc: DocumentLookupEntry = {
    id: "aksje-id",
    slug: "aksjeloven",
    documentKey: "lov/1997-06-13-44",
    type: "law",
    title: "Lov om aksjeselskaper (aksjeloven)",
    shortTitle: "aksjeloven",
  };

  return {
    fromDocumentId: docId,
    fromNodeId: null,
    currentDocumentSections: sections,
    documentsByKey: new Map([["lov/1997-06-13-44", aksjeDoc]]),
    documentsById: new Map([["aksje-id", aksjeDoc], [docId, { ...aksjeDoc, id: docId, slug: "testlov" }]]),
    aliasesByNormalized: new Map<string, AliasLookupEntry[]>([
      ["aksjeloven", [{ documentId: "aksje-id", normalizedAlias: "aksjeloven" }]],
      ["lov om aksjeselskaper", [{ documentId: "aksje-id", normalizedAlias: "lov om aksjeselskaper" }]],
    ]),
    nodesByDocumentAndSection: new Map([
      ["aksje-id", new Map([["3-1", { id: "aksje-3-1", documentId: "aksje-id", normalizedSectionNumber: "3-1", anchor: "a", slugPath: "3-1" }]])],
    ]),
    ...overrides,
  };
}

describe("parseSectionNumbersFromMatch", () => {
  it("parses single section", () => {
    expect(parseSectionNumbersFromMatch("§ 7")).toEqual(["7"]);
  });

  it("parses compound sections", () => {
    expect(parseSectionNumbersFromMatch("§§ 7 og 9")).toEqual(["7", "9"]);
  });

  it("parses hyphenated sections", () => {
    expect(parseSectionNumbersFromMatch("§ 3-1")).toEqual(["3-1"]);
  });
});

describe("resolveSameDocumentSection", () => {
  it("resolves existing section with high confidence", () => {
    const refs = resolveSameDocumentSection("jf. § 7", makeContext());
    expect(refs.length).toBeGreaterThan(0);
    expect(refs[0].targetNodeId).toBe("node-7");
    expect(refs[0].confidence).toBeGreaterThan(0.9);
    expect(refs[0].referenceType).toBe("same_document_section");
  });

  it("returns low confidence for missing section", () => {
    const refs = resolveSameDocumentSection("jf. § 999", makeContext());
    expect(refs[0].confidence).toBeLessThan(0.5);
    expect(refs[0].targetNodeId).toBeNull();
  });
});

describe("findDocumentByAlias", () => {
  it("finds document by common name", () => {
    const doc = findDocumentByAlias("aksjeloven", makeContext());
    expect(doc?.slug).toBe("aksjeloven");
  });

  it("finds document by full title reference", () => {
    const doc = findDocumentByAlias("lov om aksjeselskaper", makeContext());
    expect(doc?.slug).toBe("aksjeloven");
  });

  it("returns null for unknown alias", () => {
    const doc = findDocumentByAlias("fiktivloven", makeContext());
    expect(doc).toBeNull();
  });
});
