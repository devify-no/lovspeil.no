import { describe, it, expect } from "vitest";
import { enhanceFootnotes } from "@/lib/lovdata/footnotes";

const SAMPLE = `<article class="legalP">Loven trer i kraft fra den tiden<sup class="footnotereference" data-footnotereferencevalue="1" data-unique-footnote-counter="1">1</sup> Kongen bestemmer.</article><footer class="footnotes"><article class="footnote" data-name="1" data-unique-footnote-counter="1"><span class="footnoteLabel">1</span> Fra 1. juni 2025 iflg. res.</article></footer>`;

describe("enhanceFootnotes", () => {
  it("adds scoped ids and reference links", () => {
    const result = enhanceFootnotes(SAMPLE, "kapittel-8-paragraf-1");
    expect(result).toContain('id="fn-kapittel-8-paragraf-1-1"');
    expect(result).toContain('href="#fn-kapittel-8-paragraf-1-1"');
    expect(result).toContain('class="footnote-ref">1</a></sup>');
  });

  it("leaves html without footnotes unchanged", () => {
    const html = "<article class=\"legalP\">Plain text.</article>";
    expect(enhanceFootnotes(html, "x")).toBe(html);
  });
});
