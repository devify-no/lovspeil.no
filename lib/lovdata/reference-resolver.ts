import type { ResolvedReference } from "@/types/legal";
import { normalizeAlias, normalizeSectionNumber } from "./slug";

export interface DocumentLookupEntry {
  id: string;
  slug: string;
  documentKey: string;
  type: "law" | "regulation";
  title: string;
  shortTitle: string | null;
}

export interface NodeLookupEntry {
  id: string;
  documentId: string;
  normalizedSectionNumber: string | null;
  anchor: string;
  slugPath: string | null;
}

export interface AliasLookupEntry {
  documentId: string;
  normalizedAlias: string;
}

export interface ReferenceContext {
  fromDocumentId: string;
  fromNodeId: string | null;
  currentDocumentSections: Map<string, NodeLookupEntry>;
  documentsByKey: Map<string, DocumentLookupEntry>;
  documentsById: Map<string, DocumentLookupEntry>;
  aliasesByNormalized: Map<string, AliasLookupEntry[]>;
  nodesByDocumentAndSection: Map<string, Map<string, NodeLookupEntry>>;
}

const CONFIDENCE_THRESHOLD = 0.75;

// Same-document § references: "§ 7", "§§ 7 og 9", "§§ 7 til 10", "§ 3-1"
const SAME_DOC_SECTION_RE =
  /§§?\s*(\d+(?:\s*-\s*\d+)?(?:\s*[a-z])?)(?:\s*(?:og|til|,)\s*§§?\s*(\d+(?:\s*-\s*\d+)?(?:\s*[a-z])?))*/gi;

// External reference with law name + section: "aksjeloven § 3-1", "forvaltningsloven § 11"
const EXTERNAL_WITH_SECTION_RE =
  /((?:lov(?:en)?(?:\s+om\s+[^§]+?)?|forskrift(?:en)?(?:\s+(?:om|til)\s+[^§]+?)?|[a-zæøå\-]+loven|[a-zæøå\-]+forskriften))\s+§§?\s*(\d+(?:\s*-\s*\d+)?(?:\s*[a-z])?)/gi;

export function parseSectionNumbersFromMatch(match: string): string[] {
  const numbers: string[] = [];
  // Split compound references: "§§ 7 og 9", "§§ 7 til 10"
  const parts = match.split(/\s+(?:og|til|,)\s+/i);

  for (const part of parts) {
    const m =
      part.match(/§§?\s*(\d+(?:\s*-\s*\d+)?(?:\s+[a-z]\b)?)/i) ??
      part.match(/^(\d+(?:\s*-\s*\d+)?(?:\s+[a-z]\b)?)$/i);
    if (m) {
      const normalized = normalizeSectionNumber(`§${m[1]}`);
      if (normalized) numbers.push(normalized);
    }
  }
  return numbers;
}

export function resolveSameDocumentSection(
  rawText: string,
  context: ReferenceContext
): ResolvedReference[] {
  const results: ResolvedReference[] = [];
  const re = new RegExp(SAME_DOC_SECTION_RE.source, "gi");
  let match;

  while ((match = re.exec(rawText)) !== null) {
    const sectionNumbers = parseSectionNumbersFromMatch(match[0]);
    for (const sectionNum of sectionNumbers) {
      const targetNode = context.currentDocumentSections.get(sectionNum);
      results.push({
        rawText: match[0],
        normalizedTarget: sectionNum,
        targetDocumentId: context.fromDocumentId,
        targetNodeId: targetNode?.id ?? null,
        confidence: targetNode ? 0.95 : 0.3,
        referenceType: "same_document_section",
        resolverReason: targetNode
          ? `Matched § ${sectionNum} in same document`
          : `Section § ${sectionNum} not found in document`,
      });
    }
  }

  return results;
}

export function resolveExternalReference(
  rawText: string,
  context: ReferenceContext
): ResolvedReference[] {
  const results: ResolvedReference[] = [];

  // Try law name + section pattern first
  const withSectionRe = new RegExp(EXTERNAL_WITH_SECTION_RE.source, "gi");
  let match;

  while ((match = withSectionRe.exec(rawText)) !== null) {
    const lawRef = match[1].trim();
    const sectionRaw = match[2];
    const sectionNum = normalizeSectionNumber(`§${sectionRaw}`);
    const doc = findDocumentByAlias(lawRef, context);

    if (doc && sectionNum) {
      const sectionMap = context.nodesByDocumentAndSection.get(doc.id);
      const targetNode = sectionMap?.get(sectionNum) ?? null;
      results.push({
        rawText: match[0],
        normalizedTarget: `${doc.slug}/${sectionNum}`,
        targetDocumentId: doc.id,
        targetNodeId: targetNode?.id ?? null,
        confidence: targetNode ? 0.9 : doc ? 0.7 : 0.2,
        referenceType: "external_document_section",
        resolverReason: targetNode
          ? `Matched alias "${lawRef}" -> ${doc.slug} § ${sectionNum}`
          : `Matched document "${lawRef}" but section § ${sectionNum} not found`,
      });
    } else if (doc) {
      results.push({
        rawText: match[0],
        normalizedTarget: doc.slug,
        targetDocumentId: doc.id,
        targetNodeId: null,
        confidence: 0.6,
        referenceType: "document",
        resolverReason: `Matched document alias "${lawRef}" without section`,
      });
    }
  }

  return results;
}

export function findDocumentByAlias(
  text: string,
  context: ReferenceContext
): DocumentLookupEntry | null {
  const normalized = normalizeAlias(text);

  // Direct alias lookup
  const aliasEntries = context.aliasesByNormalized.get(normalized);
  if (aliasEntries?.length === 1) {
    return context.documentsById.get(aliasEntries[0].documentId) ?? null;
  }
  if (aliasEntries && aliasEntries.length > 1) {
    // Prefer exact match on shortTitle
    for (const entry of aliasEntries) {
      const doc = context.documentsById.get(entry.documentId);
      if (doc?.shortTitle && normalizeAlias(doc.shortTitle) === normalized) {
        return doc;
      }
    }
    return context.documentsById.get(aliasEntries[0].documentId) ?? null;
  }

  // Try without "loven" suffix variations
  const withoutLoven = normalized.replace(/\s*loven$/, "").replace(/\s*lova$/, "");
  if (withoutLoven !== normalized) {
    const entries = context.aliasesByNormalized.get(withoutLoven);
    if (entries?.length === 1) {
      return context.documentsById.get(entries[0].documentId) ?? null;
    }
  }

  // Try document key lookup: "lov/1997-06-13-44"
  const keyMatch = text.match(/lov\/(\d{4}-\d{2}-\d{2}-\d+)/);
  if (keyMatch) {
    return context.documentsByKey.get(`lov/${keyMatch[1]}`) ?? null;
  }

  return null;
}

export function resolveExplicitLink(
  href: string,
  text: string,
  context: ReferenceContext
): ResolvedReference {
  const lovdataPath = href.replace(/^\//, "");

  if (href.startsWith("#")) {
    return {
      rawText: text,
      normalizedTarget: href,
      targetDocumentId: context.fromDocumentId,
      targetNodeId: null,
      confidence: 0.5,
      referenceType: "same_document_section",
      resolverReason: "Internal anchor link",
    };
  }

  const doc = context.documentsByKey.get(lovdataPath);
  if (doc) {
    return {
      rawText: text,
      normalizedTarget: doc.slug,
      targetDocumentId: doc.id,
      targetNodeId: null,
      confidence: 0.98,
      referenceType: "document",
      resolverReason: `Explicit Lovdata link: ${lovdataPath}`,
    };
  }

  // Section in external doc: lov/1997-06-13-44/§3-1
  const sectionMatch = lovdataPath.match(
    /^(lov|forskrift)\/(\d{4}-\d{2}-\d{2}-\d+)\/§(.+)$/
  );
  if (sectionMatch) {
    const doc2 =
      context.documentsByKey.get(`${sectionMatch[1]}/${sectionMatch[2]}-${sectionMatch[3].split("/")[0]}`) ??
      context.documentsByKey.get(lovdataPath.split("/§")[0]);

    const sectionPart = lovdataPath.split("/§")[1] ?? lovdataPath.split("/")[2];
    const sectionNum = sectionPart
      ? normalizeSectionNumber(`§${sectionPart.replace(/§/, "")}`)
      : null;

    const matchedDoc =
      context.documentsByKey.get(lovdataPath.split("/§")[0]) ?? doc2;

    if (matchedDoc && sectionNum) {
      const sectionMap = context.nodesByDocumentAndSection.get(matchedDoc.id);
      const targetNode = sectionMap?.get(sectionNum) ?? null;
      return {
        rawText: text,
        normalizedTarget: `${matchedDoc.slug}/${sectionNum}`,
        targetDocumentId: matchedDoc.id,
        targetNodeId: targetNode?.id ?? null,
        confidence: targetNode ? 0.98 : 0.8,
        referenceType: "external_document_section",
        resolverReason: `Explicit Lovdata section link: ${lovdataPath}`,
      };
    }
  }

  return {
    rawText: text,
    normalizedTarget: lovdataPath,
    targetDocumentId: null,
    targetNodeId: null,
    confidence: 0.1,
    referenceType: "unknown",
    resolverReason: `Unresolved Lovdata link: ${lovdataPath}`,
  };
}

/**
 * Detect and resolve references in plain/HTML text.
 * Only auto-links when confidence >= threshold.
 */
export function detectReferencesInText(
  text: string,
  context: ReferenceContext
): ResolvedReference[] {
  const all: ResolvedReference[] = [];
  all.push(...resolveSameDocumentSection(text, context));
  all.push(...resolveExternalReference(text, context));
  return deduplicateReferences(all);
}

function deduplicateReferences(refs: ResolvedReference[]): ResolvedReference[] {
  const seen = new Set<string>();
  return refs.filter((r) => {
    const key = `${r.rawText}:${r.normalizedTarget}:${r.referenceType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function shouldAutoLink(ref: ResolvedReference): boolean {
  return ref.confidence >= CONFIDENCE_THRESHOLD;
}

export function buildReferenceUrl(
  ref: ResolvedReference,
  documentsById: Map<string, DocumentLookupEntry>,
  nodesById: Map<string, NodeLookupEntry>
): string | null {
  if (!ref.targetDocumentId) return null;
  const doc = documentsById.get(ref.targetDocumentId);
  if (!doc) return null;

  const base = doc.type === "law" ? "/lover" : "/forskrifter";

  if (ref.targetNodeId) {
    const node = nodesById.get(ref.targetNodeId);
    if (node?.slugPath) {
      return `${base}/${doc.slug}/${node.slugPath}`;
    }
  }

  if (ref.normalizedTarget.includes("/")) {
    const section = ref.normalizedTarget.split("/").pop();
    if (section && section !== doc.slug) {
      return `${base}/${doc.slug}/${section}`;
    }
  }

  return `${base}/${doc.slug}`;
}

/**
 * Apply reference links to HTML content conservatively.
 * Skips content inside existing <a> tags and headings.
 */
export function linkifyHtml(
  html: string,
  context: ReferenceContext,
  documentsById: Map<string, DocumentLookupEntry>,
  nodesById: Map<string, NodeLookupEntry>
): string {
  const refs = detectReferencesInText(
    html.replace(/<[^>]+>/g, " "),
    context
  ).filter(shouldAutoLink);

  if (refs.length === 0) return html;

  let result = html;

  // Sort by length descending to avoid partial replacements
  const sorted = [...refs].sort((a, b) => b.rawText.length - a.rawText.length);

  for (const ref of sorted) {
    const url = buildReferenceUrl(ref, documentsById, nodesById);
    if (!url) continue;

    const escaped = ref.rawText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?![^<]*>)(${escaped})`, "g");
    result = result.replace(
      re,
      `<a href="${url}" class="legal-ref" data-confidence="${ref.confidence}">$1</a>`
    );
  }

  return result;
}

export { CONFIDENCE_THRESHOLD };
