import { NextRequest, NextResponse } from "next/server";
import { searchLegalContent, parseDirectJumpQuery } from "@/lib/lovdata/search";
import { db, schema } from "@/db";
import { buildAliasIndex } from "@/lib/lovdata/alias-index";
import type { ReferenceContext } from "@/lib/lovdata/reference-resolver";
import { findDocumentByAlias } from "@/lib/lovdata/reference-resolver";
import { buildDocumentUrl, canonicalDocumentKey } from "@/lib/lovdata/slug";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const type = request.nextUrl.searchParams.get("type") ?? "all";

  if (!q.trim()) {
    return NextResponse.json({ results: [], directJump: null });
  }

  const typeFilter =
    type === "law" ? "law" : type === "regulation" ? "regulation" : "all";

  const results = await searchLegalContent({
    query: q,
    type: typeFilter as "all" | "law" | "regulation",
    limit: 20,
  });

  // Try direct jump
  let directJump = null;
  try {
    const documents = await db.select().from(schema.legalDocuments);
    const aliases = buildAliasIndex(documents);
    const aliasesByNormalized = new Map<string, Array<{ documentId: string; normalizedAlias: string }>>();
    for (const a of aliases) {
      const existing = aliasesByNormalized.get(a.normalizedAlias) ?? [];
      existing.push({ documentId: a.documentId, normalizedAlias: a.normalizedAlias });
      aliasesByNormalized.set(a.normalizedAlias, existing);
    }

    const nodesByDocumentAndSection = new Map<string, Map<string, { id: string; documentId: string; normalizedSectionNumber: string | null; anchor: string; slugPath: string | null }>>();

    const allNodes = await db.select().from(schema.legalNodes);
    for (const node of allNodes) {
      if (!node.normalizedSectionNumber) continue;
      const map = nodesByDocumentAndSection.get(node.documentId) ?? new Map();
      map.set(node.normalizedSectionNumber, node);
      nodesByDocumentAndSection.set(node.documentId, map);
    }

    const context: ReferenceContext = {
      fromDocumentId: "",
      fromNodeId: null,
      currentDocumentSections: new Map(),
      documentsByKey: new Map(
        documents.map((d) => [
          canonicalDocumentKey(d.documentKey),
          {
            id: d.id,
            slug: d.slug,
            documentKey: canonicalDocumentKey(d.documentKey),
            type: d.type as "law" | "regulation",
            title: d.title,
            shortTitle: d.shortTitle,
          },
        ])
      ),
      documentsById: new Map(
        documents.map((d) => [
          d.id,
          {
            id: d.id,
            slug: d.slug,
            documentKey: canonicalDocumentKey(d.documentKey),
            type: d.type as "law" | "regulation",
            title: d.title,
            shortTitle: d.shortTitle,
          },
        ])
      ),
      aliasesByNormalized,
      nodesByDocumentAndSection,
    };

    const { lawRef, section } = parseDirectJumpQuery(q);
    if (lawRef) {
      const doc = findDocumentByAlias(lawRef, context);
      if (doc) {
        directJump = {
          url: section
            ? buildDocumentUrl(doc.type, doc.slug, section)
            : buildDocumentUrl(doc.type, doc.slug),
        };
      }
    }
  } catch {
    // Direct jump is optional
  }

  return NextResponse.json({ results, directJump });
}
