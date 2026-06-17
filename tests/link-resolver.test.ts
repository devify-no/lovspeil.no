import { describe, it, expect } from "vitest";
import {
  parseLovdataHref,
  resolveLovdataHref,
  rewriteLinksInHtml,
  enrichLinksInHtml,
  buildDocumentLinkIndex,
} from "@/lib/lovdata/link-resolver";
import { isAmendmentDocument } from "@/lib/lovdata/document-classify";
import { normalizeAlias } from "@/lib/lovdata/slug";

function aksjeIndex() {
  return buildDocumentLinkIndex(
    [
      {
        documentKey: "lov/1997-06-13-44",
        slug: "aksjeloven",
        type: "law",
        title: "Lov om aksjeselskaper (aksjeloven)",
      },
      {
        documentKey: "lov/1997-06-13-45",
        slug: "allmennaksjeloven",
        type: "law",
        title: "Lov om allmennaksjeselskaper (allmennaksjeloven)",
      },
    ],
    [
      {
        documentKey: "lov/1997-06-13-45",
        nodeType: "chapter",
        number: "13",
        anchor: "kapittel-13",
        normalizedSectionNumber: null,
        slugPath: null,
      },
      {
        documentKey: "lov/1997-06-13-45",
        normalizedSectionNumber: "13-25",
        slugPath: "13-25",
      },
    ],
    [
      {
        documentKey: "lov/1997-06-13-45",
        normalizedAlias: normalizeAlias("lov om allmennaksjeselskaper"),
      },
    ]
  );
}

describe("parseLovdataHref", () => {
  it("parses law with section", () => {
    expect(parseLovdataHref("lov/2019-06-14-21/§89")).toEqual({
      documentKey: "lov/2019-06-14-21",
      type: "law",
      sectionPart: "89",
      chapterPart: null,
    });
  });

  it("parses chapter link", () => {
    expect(parseLovdataHref("lov/1997-06-13-45/kap13")).toEqual({
      documentKey: "lov/1997-06-13-45",
      type: "law",
      sectionPart: null,
      chapterPart: "13",
    });
  });

  it("parses forskrift without section", () => {
    expect(parseLovdataHref("forskrift/1999-10-22-1097")).toEqual({
      documentKey: "forskrift/1999-10-22-1097",
      type: "regulation",
      sectionPart: null,
      chapterPart: null,
    });
  });
});

describe("resolveLovdataHref", () => {
  const index = buildDocumentLinkIndex(
    [
      {
        documentKey: "lov/1981-05-22-25",
        slug: "straffeloven-1981",
        type: "law",
        title: "Lov om rettergang m.m. (straffeprosessloven)",
      },
      {
        documentKey: "lov/2019-06-14-21",
        slug: "lov-om-endringer-i-noe",
        type: "law",
        title: "Lov om endringer i noe",
      },
    ],
    [
      {
        documentKey: "lov/1981-05-22-25",
        normalizedSectionNumber: "203",
        slugPath: "203",
      },
    ]
  );

  it("resolves internal section link", () => {
    expect(resolveLovdataHref("lov/1981-05-22-25/§203", index)).toBe(
      "/lover/straffeloven-1981/203"
    );
  });

  it("resolves chapter link", () => {
    const alIndex = aksjeIndex();
    expect(resolveLovdataHref("lov/1997-06-13-45/kap13", alIndex)).toBe(
      "/lover/allmennaksjeloven#kapittel-13"
    );
  });

  it("sends amendment laws to Lovdata", () => {
    expect(resolveLovdataHref("lov/2019-06-14-21/§89", index)).toBe(
      "https://lovdata.no/lov/2019-06-14-21/§89"
    );
  });
});

describe("rewriteLinksInHtml", () => {
  it("rewrites relative lovdata hrefs", () => {
    const index = buildDocumentLinkIndex(
      [
        {
          documentKey: "lov/1997-06-13-44",
          slug: "aksjeloven",
          type: "law",
          title: "Lov om aksjeselskaper (aksjeloven)",
        },
      ],
      []
    );

    const html = '<p>Se <a href="lov/1997-06-13-44">aksjeloven</a>.</p>';
    const result = rewriteLinksInHtml(html, index);
    expect(result).toContain('href="/lover/aksjeloven"');
    expect(result).toContain('class="legal-link legal-link--internal"');
    expect(result).not.toContain('href="lov/');
  });

  it("resolves forskrift links with legacy sf/ document keys", () => {
    const index = buildDocumentLinkIndex(
      [
        {
          documentKey: "sf/forskrift/2024-12-20-3296",
          slug: "res-20-des-2024-nr-3296",
          type: "regulation",
          title: "Res. om ikrafttredelse av abortloven",
        },
      ],
      []
    );

    const html =
      '<p>Se <a href="forskrift/2024-12-20-3296">res. 20 des 2024 nr. 3296</a>.</p>';
    const result = rewriteLinksInHtml(html, index);
    expect(result).toContain('href="/forskrifter/res-20-des-2024-nr-3296"');
    expect(result).toContain('class="legal-link legal-link--internal"');
  });
});

describe("enrichLinksInHtml", () => {
  const index = aksjeIndex();

  it("linkifies plain-text lov om references", () => {
    const html =
      "<article>Bestemmelsene om bedriftsforsamling i lov om allmennaksjeselskaper gjelder tilsvarende.</article>";
    const result = enrichLinksInHtml(html, index);
    expect(result).toContain(
      '<a href="/lover/allmennaksjeloven" class="legal-link legal-link--internal">lov om allmennaksjeselskaper</a>'
    );
  });

  it("expands kapittel prefix into chapter link", () => {
    const html =
      '<article>gjelder bestemmelsene i kapittel 13 i <a href="lov/1997-06-13-45/kap13">lov om allmennaksjeselskaper.</a></article>';
    const result = enrichLinksInHtml(html, index);
    expect(result).toContain(
      '<a href="/lover/allmennaksjeloven#kapittel-13" class="legal-link legal-link--internal">kapittel 13 i lov om allmennaksjeselskaper.</a>'
    );
  });

  it("expands section range prefix into section link", () => {
    const html =
      '<article>gjelder bestemmelsene i §§ 13-25 til 13-36 i <a href="lov/1997-06-13-45/§13-25">lov om allmennaksjeselskaper</a> tilsvarende.</article>';
    const result = enrichLinksInHtml(html, index);
    expect(result).toContain(
      '<a href="/lover/allmennaksjeloven/13-25" class="legal-link legal-link--internal">§§ 13-25 til 13-36 i lov om allmennaksjeselskaper</a>'
    );
  });
});

describe("isAmendmentDocument", () => {
  it("detects amendment laws", () => {
    expect(isAmendmentDocument("Lov om endringer i utleveringsloven m.m.")).toBe(
      true
    );
    expect(isAmendmentDocument("Lov om aksjeselskaper (aksjeloven)")).toBe(false);
  });
});
