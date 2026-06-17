import type { LegalNode } from "@/db/schema";

/** Roman-numeral sub-parts (e.g. "I. Oppløsning…") inside a chapter – skip in ToC. */
export function isSubPartChapter(node: LegalNode): boolean {
  if (node.nodeType !== "chapter") return false;
  const label = node.title?.trim() ?? "";
  return /^[IVXLC]+\.\s/.test(label);
}

export function stripArticleHeader(html: string): string {
  return html
    .replace(
      /<h[1-6][^>]*class="[^"]*legalArticleHeader[^"]*"[^>]*>[\s\S]*?<\/h[1-6]>/gi,
      ""
    )
    .trim();
}

export function formatChapterHeading(
  node: Pick<LegalNode, "number" | "title">,
  depth: number
): string | null {
  if (!node.title && !node.number) return null;

  const num = node.number?.replace(/^§\s*/i, "").trim();
  if (depth === 0 && num && /^\d+[a-z]?$/i.test(num)) {
    return node.title ? `Kapittel ${num}. ${node.title}` : `Kapittel ${num}`;
  }

  return node.title ?? node.number;
}

export function formatSectionHeading(
  node: Pick<LegalNode, "number" | "title" | "normalizedSectionNumber">
): string {
  const num =
    node.number ??
    (node.normalizedSectionNumber ? `§ ${node.normalizedSectionNumber}` : null);

  if (num && node.title) {
    const normalizedNum = num.replace(/\s+/g, " ").trim();
    if (normalizedNum.toLowerCase().includes(node.title.toLowerCase())) {
      return normalizedNum;
    }
    return `${normalizedNum}. ${node.title}`;
  }

  return num ?? node.title ?? "";
}

export function formatTocLabel(
  node: Pick<
    LegalNode,
    "nodeType" | "number" | "title" | "normalizedSectionNumber"
  >
): string {
  if (node.nodeType === "section" && node.normalizedSectionNumber) {
    const title = node.title?.trim();
    return title
      ? `§ ${node.normalizedSectionNumber}. ${title}`
      : `§ ${node.normalizedSectionNumber}`;
  }

  if (node.nodeType === "chapter") {
    return formatChapterHeading(node, 0) ?? node.title ?? node.number ?? "";
  }

  return node.title ?? node.number ?? "";
}

export function headingLevel(
  nodeType: LegalNode["nodeType"],
  depth: number
): "h2" | "h3" | "h4" | null {
  if (nodeType === "chapter") return depth === 0 ? "h2" : "h3";
  if (nodeType === "section") return depth <= 1 ? "h3" : "h4";
  return null;
}

export const headingClass: Record<"h2" | "h3" | "h4", string> = {
  h2: "mb-4 mt-8 scroll-mt-24 text-xl font-semibold text-stone-900 first:mt-0",
  h3: "mb-3 mt-6 scroll-mt-24 text-lg font-semibold text-stone-900",
  h4: "mb-2 mt-4 scroll-mt-24 text-base font-semibold text-stone-900",
};
