import type { LegalDocument, LegalNode } from "@/db/schema";
import type { DocumentType } from "@/types/legal";
import { buildDocumentUrl } from "@/lib/lovdata/slug";
import { absoluteUrl } from "@/lib/seo/site";

export function getDocumentCanonicalPath(
  type: DocumentType,
  slug: string
): string {
  return buildDocumentUrl(type, slug);
}

export function getDocumentCanonicalUrl(
  type: DocumentType,
  slug: string
): string {
  return absoluteUrl(getDocumentCanonicalPath(type, slug));
}

export function getSectionCanonicalPath(
  type: DocumentType,
  slug: string,
  sectionSlug: string
): string {
  return buildDocumentUrl(type, slug, sectionSlug);
}

export function getSectionCanonicalUrl(
  type: DocumentType,
  slug: string,
  sectionSlug: string
): string {
  return absoluteUrl(getSectionCanonicalPath(type, slug, sectionSlug));
}

/**
 * Deterministic chapter anchor for in-page links and share URLs.
 */
export function getChapterAnchor(
  node: Pick<LegalNode, "nodeType" | "number" | "anchor">
): string {
  if (node.nodeType !== "chapter") return node.anchor;

  const num = node.number
    ?.replace(/^§\s*/i, "")
    .replace(/^kapittel\s*/i, "")
    .trim();

  if (num && /^[\dIVXLC]+[a-z]?$/i.test(num)) {
    return `kapittel-${num.toLowerCase()}`;
  }

  return node.anchor;
}

/**
 * Deterministic section anchor for in-page links and share URLs.
 */
export function getSectionAnchor(
  node: Pick<LegalNode, "nodeType" | "normalizedSectionNumber" | "anchor">
): string {
  if (node.nodeType === "section" && node.normalizedSectionNumber) {
    return `paragraf-${node.normalizedSectionNumber}`;
  }
  return node.anchor;
}

export function getChapterShareUrl(
  type: DocumentType,
  slug: string,
  chapterAnchor: string
): string {
  return `${getDocumentCanonicalUrl(type, slug)}#${chapterAnchor}`;
}

export function documentLastModified(doc: LegalDocument): Date | undefined {
  return doc.sourceUpdatedAt ?? doc.importedAt ?? undefined;
}
