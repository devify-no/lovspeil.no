import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { buildAliasIndex } from "@/lib/lovdata/alias-index";
import {
  detectReferencesInText,
  findDocumentByAlias,
  type ReferenceContext,
} from "@/lib/lovdata/reference-resolver";
import { canonicalDocumentKey } from "@/lib/lovdata/slug";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { text, documentSlug } = body as { text: string; documentSlug?: string };

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const documents = await db.select().from(schema.legalDocuments);
  const aliases = buildAliasIndex(documents);

  const aliasesByNormalized = new Map<string, Array<{ documentId: string; normalizedAlias: string }>>();
  for (const a of aliases) {
    const existing = aliasesByNormalized.get(a.normalizedAlias) ?? [];
    existing.push({ documentId: a.documentId, normalizedAlias: a.normalizedAlias });
    aliasesByNormalized.set(a.normalizedAlias, existing);
  }

  const allNodes = await db.select().from(schema.legalNodes);
  const nodesByDocumentAndSection = new Map<string, Map<string, { id: string; documentId: string; normalizedSectionNumber: string | null; anchor: string; slugPath: string | null }>>();
  for (const node of allNodes) {
    if (!node.normalizedSectionNumber) continue;
    const map = nodesByDocumentAndSection.get(node.documentId) ?? new Map();
    map.set(node.normalizedSectionNumber, node);
    nodesByDocumentAndSection.set(node.documentId, map);
  }

  const fromDoc = documentSlug
    ? documents.find((d) => d.slug === documentSlug)
    : null;

  const currentDocumentSections = fromDoc
    ? nodesByDocumentAndSection.get(fromDoc.id) ?? new Map()
    : new Map();

  const context: ReferenceContext = {
    fromDocumentId: fromDoc?.id ?? "",
    fromNodeId: null,
    currentDocumentSections,
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

  const references = detectReferencesInText(text, context);

  return NextResponse.json({ references });
}

export async function GET(request: NextRequest) {
  const alias = request.nextUrl.searchParams.get("alias");
  if (!alias) {
    return NextResponse.json({ error: "alias query param required" }, { status: 400 });
  }

  const documents = await db.select().from(schema.legalDocuments);
  const aliases = buildAliasIndex(documents);
  const aliasesByNormalized = new Map<string, Array<{ documentId: string; normalizedAlias: string }>>();
  for (const a of aliases) {
    const existing = aliasesByNormalized.get(a.normalizedAlias) ?? [];
    existing.push({ documentId: a.documentId, normalizedAlias: a.normalizedAlias });
    aliasesByNormalized.set(a.normalizedAlias, existing);
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
    nodesByDocumentAndSection: new Map(),
  };

  const doc = findDocumentByAlias(alias, context);
  return NextResponse.json({ alias, resolved: doc });
}
