import { describe, it, expect } from "vitest";
import {
  getChapterAnchor,
  getChapterShareUrl,
  getDocumentCanonicalPath,
  getDocumentCanonicalUrl,
  getSectionAnchor,
  getSectionCanonicalPath,
  getSectionCanonicalUrl,
} from "@/lib/seo/urls";

describe("SEO URL helpers", () => {
  it("builds document canonical paths", () => {
    expect(getDocumentCanonicalPath("law", "aksjeloven")).toBe(
      "/lover/aksjeloven"
    );
    expect(getDocumentCanonicalPath("regulation", "aksjeforskriften")).toBe(
      "/forskrifter/aksjeforskriften"
    );
  });

  it("builds section canonical paths", () => {
    expect(getSectionCanonicalPath("law", "aksjeloven", "3-4")).toBe(
      "/lover/aksjeloven/3-4"
    );
    expect(
      getSectionCanonicalPath("regulation", "aksjeforskriften", "2")
    ).toBe("/forskrifter/aksjeforskriften/2");
  });

  it("builds absolute URLs from site base", () => {
    expect(getDocumentCanonicalUrl("law", "aksjeloven")).toBe(
      "https://lovspeil.no/lover/aksjeloven"
    );
    expect(getSectionCanonicalUrl("law", "forvaltningsloven", "11")).toBe(
      "https://lovspeil.no/lover/forvaltningsloven/11"
    );
  });

  it("generates deterministic chapter anchors", () => {
    expect(
      getChapterAnchor({
        nodeType: "chapter",
        number: "3",
        anchor: "kapIII",
      })
    ).toBe("kapittel-3");
  });

  it("generates deterministic section anchors", () => {
    expect(
      getSectionAnchor({
        nodeType: "section",
        normalizedSectionNumber: "3-4",
        anchor: "paragraf-3-4",
      })
    ).toBe("paragraf-3-4");

    expect(
      getSectionAnchor({
        nodeType: "section",
        normalizedSectionNumber: "11",
        anchor: "old-anchor",
      })
    ).toBe("paragraf-11");
  });

  it("builds chapter share URLs with hash", () => {
    expect(getChapterShareUrl("law", "aksjeloven", "kapittel-3")).toBe(
      "https://lovspeil.no/lover/aksjeloven#kapittel-3"
    );
  });
});
