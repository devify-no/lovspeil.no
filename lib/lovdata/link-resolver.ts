import { buildDocumentUrl, canonicalDocumentKey, normalizeSectionNumber } from "./slug";
import { isAmendmentDocument } from "./document-classify";
import type { DocumentType } from "@/types/legal";
import type { DocumentLinkIndex, DocumentLinkTarget } from "./link-resolver-types";
import {
  buildAliasMapForDocuments,
  expandAdjacentReferenceLinks,
  linkifyPlainTextInHtml,
} from "./plain-text-linkifier";

export type { DocumentLinkIndex, DocumentLinkTarget } from "./link-resolver-types";

const LOVDATA_PATH_RE =
  /^(lov|forskrift)\/(\d{4}-\d{2}-\d{2}(?:-\d+)?)(?:\/(.+))?$/i;

const CHAPTER_PART_RE = /^kap(\d+[a-z]?)$/i;

export function parseLovdataHref(
  href: string
): {
  documentKey: string;
  type: DocumentType;
  sectionPart: string | null;
  chapterPart: string | null;
} | null {
  const decoded = decodeURIComponent(href.trim()).replace(/^\//, "");
  const match = decoded.match(LOVDATA_PATH_RE);
  if (!match) return null;

  const kind = match[1].toLowerCase();
  const documentKey = `${kind}/${match[2]}`;
  const rawPart = match[3]?.replace(/^§\s*/i, "") ?? null;

  let sectionPart: string | null = null;
  let chapterPart: string | null = null;

  if (rawPart) {
    const chapterMatch = rawPart.match(CHAPTER_PART_RE);
    if (chapterMatch) {
      chapterPart = chapterMatch[1].toLowerCase();
    } else {
      sectionPart = rawPart;
    }
  }

  return {
    documentKey,
    type: kind === "lov" ? "law" : "regulation",
    sectionPart,
    chapterPart,
  };
}

function sectionLookupVariants(sectionPart: string): string[] {
  const normalized = normalizeSectionNumber(`§${sectionPart}`);
  if (!normalized) return [];

  const variants = new Set<string>([normalized]);
  variants.add(normalized.replace(/(\d)-([a-z])$/, "$1$2"));
  variants.add(normalized.replace(/(\d)([a-z])$/, "$1-$2"));
  return [...variants];
}

export function resolveLovdataHref(
  href: string,
  index: DocumentLinkIndex
): string {
  const parsed = parseLovdataHref(href);
  if (!parsed) {
    if (href.startsWith("legal-areas/") || href.startsWith("http")) {
      return href.startsWith("http") ? href : `https://lovdata.no/${href}`;
    }
    return href;
  }

  const doc = index.byKey.get(parsed.documentKey);
  if (!doc) {
    return `https://lovdata.no/${parsed.documentKey}${
      parsed.sectionPart ? `/§${parsed.sectionPart}` : parsed.chapterPart ? `/kap${parsed.chapterPart}` : ""
    }`;
  }

  if (doc.isAmendment) {
    return `https://lovdata.no/${parsed.documentKey}${
      parsed.sectionPart ? `/§${parsed.sectionPart}` : parsed.chapterPart ? `/kap${parsed.chapterPart}` : ""
    }`;
  }

  if (parsed.chapterPart) {
    const chapterMap = index.chaptersByKey.get(parsed.documentKey);
    const anchor = chapterMap?.get(parsed.chapterPart);
    const base = buildDocumentUrl(doc.type, doc.slug);
    return anchor ? `${base}#${anchor}` : base;
  }

  if (parsed.sectionPart) {
    const sectionMap = index.sectionsByKey.get(parsed.documentKey);
    if (sectionMap) {
      for (const variant of sectionLookupVariants(parsed.sectionPart)) {
        const slugPath = sectionMap.get(variant);
        if (slugPath) {
          return buildDocumentUrl(doc.type, doc.slug, slugPath);
        }
      }
    }
    return buildDocumentUrl(doc.type, doc.slug);
  }

  return buildDocumentUrl(doc.type, doc.slug);
}

/**
 * Rewrite Lovdata relative hrefs in stored HTML to internal or Lovdata URLs.
 */
export function rewriteLinksInHtml(
  html: string,
  index: DocumentLinkIndex
): string {
  return html.replace(
    /href="([^"]+)"/gi,
    (match, href: string) => {
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("https://") ||
        href.startsWith("http://")
      ) {
        return match;
      }

      const resolved = resolveLovdataHref(href, index);
      const isExternal = resolved.startsWith("http");
      const linkClass = isExternal
        ? "legal-link legal-link--external"
        : "legal-link legal-link--internal";

      if (isExternal) {
        return ` href="${resolved}" class="${linkClass}" target="_blank" rel="noopener noreferrer"`;
      }
      return ` href="${resolved}" class="${linkClass}"`;
    }
  );
}

/**
 * Rewrite explicit Lovdata links, expand partial references, and linkify plain text.
 */
export function enrichLinksInHtml(
  html: string,
  index: DocumentLinkIndex
): string {
  let result = rewriteLinksInHtml(html, index);
  result = expandAdjacentReferenceLinks(result);
  result = linkifyPlainTextInHtml(result, index);
  return result;
}

export function buildDocumentLinkIndex(
  documents: Array<{
    documentKey: string;
    slug: string;
    type: string;
    title: string;
  }>,
  nodes: Array<{
    documentKey: string;
    nodeType?: string | null;
    number?: string | null;
    anchor?: string | null;
    normalizedSectionNumber: string | null;
    slugPath: string | null;
  }>,
  extraAliases: Array<{ documentKey: string; normalizedAlias: string }> = []
): DocumentLinkIndex {
  const byKey = new Map<string, DocumentLinkTarget>();
  for (const doc of documents) {
    byKey.set(canonicalDocumentKey(doc.documentKey), {
      slug: doc.slug,
      type: doc.type as DocumentType,
      isAmendment: isAmendmentDocument(doc.title),
    });
  }

  const sectionsByKey = new Map<string, Map<string, string>>();
  const chaptersByKey = new Map<string, Map<string, string>>();

  for (const node of nodes) {
    const nodeKey = canonicalDocumentKey(node.documentKey);

    if (node.nodeType === "chapter" && node.number && node.anchor) {
      const map = chaptersByKey.get(nodeKey) ?? new Map();
      map.set(node.number.toLowerCase(), node.anchor);
      chaptersByKey.set(nodeKey, map);
    }

    if (!node.normalizedSectionNumber || !node.slugPath) continue;
    const map = sectionsByKey.get(nodeKey) ?? new Map();
    map.set(node.normalizedSectionNumber, node.slugPath);
    map.set(node.slugPath, node.slugPath);
    sectionsByKey.set(nodeKey, map);
  }

  const canonicalDocs = documents.map((doc) => ({
    ...doc,
    documentKey: canonicalDocumentKey(doc.documentKey),
  }));
  const canonicalAliases = extraAliases.map((alias) => ({
    ...alias,
    documentKey: canonicalDocumentKey(alias.documentKey),
  }));
  const aliasesByNormalized = buildAliasMapForDocuments(
    canonicalDocs,
    canonicalAliases
  );

  return { byKey, sectionsByKey, chaptersByKey, aliasesByNormalized };
}
