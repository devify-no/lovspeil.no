import { sql, eq, and, or, ilike } from "drizzle-orm";
import { db, schema } from "@/db";
import type { SearchResult, DocumentType } from "@/types/legal";
import { buildDocumentUrl, normalizeAlias, normalizeSectionNumber } from "./slug";
import { findDocumentByAlias, type ReferenceContext } from "./reference-resolver";

const notAmendmentFilter = sql`(
  ${schema.legalDocuments.title} NOT ILIKE 'lov om endring%'
  AND ${schema.legalDocuments.title} NOT ILIKE 'forskrift om endring%'
)`;

export interface SearchOptions {
  query: string;
  type?: DocumentType | "all";
  limit?: number;
}

export interface DirectJumpResult {
  url: string;
  documentTitle: string;
  sectionNumber: string | null;
}

/**
 * Parse direct jump queries like "aksjeloven 3-1", "forvaltningsloven § 11".
 */
export function parseDirectJumpQuery(query: string): {
  lawRef: string | null;
  section: string | null;
} {
  const trimmed = query.trim();

  // "aksjeloven § 3-1" or "aksjeloven 3-1"
  const withSection = trimmed.match(
    /^(.+?)\s+§§?\s*(\d+(?:\s*-\s*\d+)?(?:\s*[a-z])?)\s*$/i
  );
  if (withSection) {
    return {
      lawRef: withSection[1].trim(),
      section: normalizeSectionNumber(`§${withSection[2]}`),
    };
  }

  const withSectionNoSymbol = trimmed.match(
    /^([a-zæøå\-]+loven)\s+(\d+(?:-\d+)?(?:[a-z])?)\s*$/i
  );
  if (withSectionNoSymbol) {
    return {
      lawRef: withSectionNoSymbol[1].trim(),
      section: normalizeSectionNumber(`§${withSectionNoSymbol[2]}`),
    };
  }

  return { lawRef: null, section: null };
}

export async function tryDirectJump(
  query: string,
  context: ReferenceContext
): Promise<DirectJumpResult | null> {
  const { lawRef, section } = parseDirectJumpQuery(query);
  if (!lawRef) return null;

  const doc = findDocumentByAlias(lawRef, context);
  if (!doc) return null;

  const url = section
    ? buildDocumentUrl(doc.type, doc.slug, section)
    : buildDocumentUrl(doc.type, doc.slug);

  return {
    url,
    documentTitle: doc.title,
    sectionNumber: section,
  };
}

export async function searchLegalContent(
  options: SearchOptions
): Promise<SearchResult[]> {
  const { query, type = "all", limit = 20 } = options;
  const trimmed = query.trim();
  if (!trimmed) return [];

  const typeFilter =
    type === "all"
      ? notAmendmentFilter
      : and(
          eq(schema.legalDocuments.type, type === "law" ? "law" : "regulation"),
          notAmendmentFilter
        );

  const textFilter = or(
    ilike(schema.legalDocuments.title, `%${trimmed}%`),
    ilike(schema.legalDocuments.shortTitle, `%${trimmed}%`),
    ilike(schema.legalDocuments.slug, `%${trimmed}%`)
  );

  // Search documents by title
  const docResults = await db
    .select({
      id: schema.legalDocuments.id,
      slug: schema.legalDocuments.slug,
      title: schema.legalDocuments.title,
      type: schema.legalDocuments.type,
      shortTitle: schema.legalDocuments.shortTitle,
    })
    .from(schema.legalDocuments)
    .where(and(typeFilter, textFilter))
    .limit(limit);

  const results: SearchResult[] = docResults.map((doc) => ({
    documentId: doc.id,
    documentSlug: doc.slug,
    documentTitle: doc.title,
    documentType: doc.type as DocumentType,
    nodeId: null,
    nodeAnchor: null,
    sectionNumber: null,
    sectionTitle: null,
    snippet: doc.shortTitle ?? doc.title,
    score: doc.slug === normalizeAlias(trimmed) ? 100 : 50,
    url: buildDocumentUrl(doc.type as DocumentType, doc.slug),
  }));

  // Search nodes by plain text
  const nodeResults = await db
    .select({
      nodeId: schema.legalNodes.id,
      anchor: schema.legalNodes.anchor,
      plainText: schema.legalNodes.plainText,
      sectionNumber: schema.legalNodes.normalizedSectionNumber,
      sectionTitle: schema.legalNodes.title,
      slugPath: schema.legalNodes.slugPath,
      documentId: schema.legalDocuments.id,
      documentSlug: schema.legalDocuments.slug,
      documentTitle: schema.legalDocuments.title,
      documentType: schema.legalDocuments.type,
    })
    .from(schema.legalNodes)
    .innerJoin(
      schema.legalDocuments,
      eq(schema.legalNodes.documentId, schema.legalDocuments.id)
    )
    .where(and(typeFilter, ilike(schema.legalNodes.plainText, `%${trimmed}%`)))
    .limit(limit);

  for (const node of nodeResults) {
    const idx = node.plainText.toLowerCase().indexOf(trimmed.toLowerCase());
    const start = Math.max(0, idx - 60);
    const snippet =
      (start > 0 ? "…" : "") +
      node.plainText.slice(start, start + 160) +
      (start + 160 < node.plainText.length ? "…" : "");

    results.push({
      documentId: node.documentId,
      documentSlug: node.documentSlug,
      documentTitle: node.documentTitle,
      documentType: node.documentType as DocumentType,
      nodeId: node.nodeId,
      nodeAnchor: node.anchor,
      sectionNumber: node.sectionNumber,
      sectionTitle: node.sectionTitle,
      snippet,
      score: node.sectionNumber === trimmed ? 90 : 30,
      url: node.slugPath
        ? buildDocumentUrl(
            node.documentType as DocumentType,
            node.documentSlug,
            node.slugPath
          )
        : buildDocumentUrl(node.documentType as DocumentType, node.documentSlug),
    });
  }

  // Deduplicate and sort by score
  const seen = new Set<string>();
  return results
    .filter((r) => {
      const key = r.url;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Interface for future external search engine integration.
 */
export interface SearchEngineAdapter {
  index(documents: unknown[]): Promise<void>;
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  deleteAll(): Promise<void>;
}

export class PostgresSearchEngine implements SearchEngineAdapter {
  async index(): Promise<void> {
    // Full-text search vectors can be updated here when migrating to tsvector
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    return searchLegalContent({ query, ...options });
  }

  async deleteAll(): Promise<void> {
    // No-op for postgres-backed search
  }
}
