import { describe, it, expect } from "vitest";
import {
  formatChapterHeading,
  formatSectionHeading,
  formatTocLabel,
  isSubPartChapter,
  stripArticleHeader,
} from "@/lib/lovdata/node-display";

describe("stripArticleHeader", () => {
  it("removes legalArticleHeader from html", () => {
    const html =
      '<h4 class="legalArticleHeader"><span class="legalArticleValue">§ 16-1</span>. <span class="legalArticleTitle">Beslutning om oppløsning</span></h4><article>(1) Text</article>';
    expect(stripArticleHeader(html)).toBe("<article>(1) Text</article>");
  });
});

describe("formatChapterHeading", () => {
  it("formats top-level chapter with Kapittel prefix", () => {
    expect(
      formatChapterHeading({ number: "16", title: "Oppløsning og avvikling" }, 0)
    ).toBe("Kapittel 16. Oppløsning og avvikling");
  });

  it("formats sub-part without Kapittel prefix", () => {
    expect(
      formatChapterHeading(
        { number: null, title: "I. Oppløsning etter beslutning" },
        1
      )
    ).toBe("I. Oppløsning etter beslutning");
  });
});

describe("formatSectionHeading", () => {
  it("combines section number and title", () => {
    expect(
      formatSectionHeading({
        number: "§ 16-1",
        title: "Beslutning om oppløsning",
        normalizedSectionNumber: "16-1",
      })
    ).toBe("§ 16-1. Beslutning om oppløsning");
  });
});

describe("isSubPartChapter", () => {
  it("detects Roman-numeral sub-parts", () => {
    expect(
      isSubPartChapter({
        nodeType: "chapter",
        title: "I. Oppløsning og avvikling etter beslutning",
      } as never)
    ).toBe(true);
    expect(
      isSubPartChapter({
        nodeType: "chapter",
        title: "Oppløsning og avvikling",
        number: "16",
      } as never)
    ).toBe(false);
  });
});

describe("formatTocLabel", () => {
  it("formats chapter and section labels", () => {
    expect(
      formatTocLabel({
        nodeType: "chapter",
        number: "16",
        title: "Oppløsning og avvikling",
        normalizedSectionNumber: null,
      } as never)
    ).toBe("Kapittel 16. Oppløsning og avvikling");

    expect(
      formatTocLabel({
        nodeType: "section",
        number: "§ 16-1",
        title: "Beslutning om oppløsning",
        normalizedSectionNumber: "16-1",
      } as never)
    ).toBe("§ 16-1. Beslutning om oppløsning");
  });
});
