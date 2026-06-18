import { db, schema } from "@/db";
import { eq, asc, and, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { LegalDocument, LegalNode } from "@/db/schema";
import type { TocEntry } from "@/types/legal";
import {
  formatTocLabel,
  isSubPartChapter,
} from "@/lib/lovdata/node-display";
import { getChapterAnchor, getSectionAnchor } from "@/lib/seo/urls";
import { cache } from "react";
import { isAmendmentDocument } from "@/lib/lovdata/document-classify";
import {
  buildDocumentLinkIndex,
  type DocumentLinkIndex,
} from "@/lib/lovdata/link-resolver";

/** SQL filter excluding amendment acts from listings */
const notAmendmentFilter = sql`(
  ${schema.legalDocuments.title} NOT ILIKE 'lov om endring%'
  AND ${schema.legalDocuments.title} NOT ILIKE 'forskrift om endring%'
)`;

export async function getAllDocuments(type?: "law" | "regulation") {
  const conditions = [notAmendmentFilter];
  if (type) {
    conditions.push(eq(schema.legalDocuments.type, type));
  }

  return db
    .select()
    .from(schema.legalDocuments)
    .where(and(...conditions))
    .orderBy(asc(schema.legalDocuments.title));
}

let linkIndexPromise: Promise<DocumentLinkIndex> | null = null;

async function fetchDocumentLinkIndex(): Promise<DocumentLinkIndex> {
  const documents = await db
    .select({
      documentKey: schema.legalDocuments.documentKey,
      slug: schema.legalDocuments.slug,
      type: schema.legalDocuments.type,
      title: schema.legalDocuments.title,
    })
    .from(schema.legalDocuments);

  const nodes = await db
    .select({
      documentKey: schema.legalDocuments.documentKey,
      nodeType: schema.legalNodes.nodeType,
      number: schema.legalNodes.number,
      anchor: schema.legalNodes.anchor,
      normalizedSectionNumber: schema.legalNodes.normalizedSectionNumber,
      slugPath: schema.legalNodes.slugPath,
    })
    .from(schema.legalNodes)
    .innerJoin(
      schema.legalDocuments,
      eq(schema.legalNodes.documentId, schema.legalDocuments.id)
    );

  const dbAliases = await db
    .select({
      documentKey: schema.legalDocuments.documentKey,
      normalizedAlias: schema.documentAliases.normalizedAlias,
    })
    .from(schema.documentAliases)
    .innerJoin(
      schema.legalDocuments,
      eq(schema.documentAliases.documentId, schema.legalDocuments.id)
    );

  return buildDocumentLinkIndex(documents, nodes, dbAliases);
}

/** Cached per-request and per build worker – link index is the same for all pages. */
export const getDocumentLinkIndex = cache(async (): Promise<DocumentLinkIndex> => {
  if (!linkIndexPromise) {
    linkIndexPromise = fetchDocumentLinkIndex();
  }
  return linkIndexPromise;
});

export async function getDocumentBySlug(slug: string) {
  const [doc] = await db
    .select()
    .from(schema.legalDocuments)
    .where(eq(schema.legalDocuments.slug, slug))
    .limit(1);
  if (!doc) return null;
  if (isAmendmentDocument(doc.title)) return null;
  return doc;
}

export async function getDocumentNodes(documentId: string) {
  return db
    .select()
    .from(schema.legalNodes)
    .where(eq(schema.legalNodes.documentId, documentId))
    .orderBy(asc(schema.legalNodes.order));
}

export async function getSectionBySlugPath(
  documentId: string,
  slugPath: string
) {
  const [node] = await db
    .select()
    .from(schema.legalNodes)
    .where(
      and(
        eq(schema.legalNodes.documentId, documentId),
        eq(schema.legalNodes.slugPath, slugPath)
      )
    )
    .limit(1);
  return node ?? null;
}

export async function getIncomingReferences(nodeId: string) {
  return db
    .select({
      ref: schema.legalReferences,
      fromDoc: schema.legalDocuments,
      fromNode: schema.legalNodes,
    })
    .from(schema.legalReferences)
    .innerJoin(
      schema.legalDocuments,
      eq(schema.legalReferences.fromDocumentId, schema.legalDocuments.id)
    )
    .leftJoin(
      schema.legalNodes,
      eq(schema.legalReferences.fromNodeId, schema.legalNodes.id)
    )
    .where(eq(schema.legalReferences.targetNodeId, nodeId));
}

export async function getOutgoingReferences(nodeId: string) {
  const targetDoc = alias(schema.legalDocuments, "target_doc");

  return db
    .select({
      ref: schema.legalReferences,
      targetDoc,
      targetNode: schema.legalNodes,
    })
    .from(schema.legalReferences)
    .leftJoin(
      targetDoc,
      eq(schema.legalReferences.targetDocumentId, targetDoc.id)
    )
    .leftJoin(
      schema.legalNodes,
      eq(schema.legalReferences.targetNodeId, schema.legalNodes.id)
    )
    .where(eq(schema.legalReferences.fromNodeId, nodeId));
}

export function buildToc(nodes: LegalNode[]): TocEntry[] {
  const childrenMap = new Map<string | null, LegalNode[]>();

  for (const node of nodes) {
    const parentId = node.parentId;
    const siblings = childrenMap.get(parentId) ?? [];
    siblings.push(node);
    childrenMap.set(parentId, siblings);
  }

  for (const siblings of childrenMap.values()) {
    siblings.sort((a, b) => a.order - b.order);
  }

  function buildTree(parentId: string | null): TocEntry[] {
    const children = childrenMap.get(parentId) ?? [];
    const entries: TocEntry[] = [];

    for (const node of children) {
      if (node.nodeType !== "chapter" && node.nodeType !== "section") continue;

      if (node.nodeType === "chapter" && isSubPartChapter(node)) {
        entries.push(...buildTree(node.id));
        continue;
      }

      const anchor =
        node.nodeType === "chapter"
          ? getChapterAnchor(node)
          : node.nodeType === "section"
            ? getSectionAnchor(node)
            : node.anchor;

      entries.push({
        id: node.id,
        title: node.title ?? node.number ?? node.anchor,
        label: formatTocLabel(node),
        anchor,
        slugPath: node.slugPath,
        sectionNumber: node.normalizedSectionNumber,
        children: buildTree(node.id),
      });
    }

    return entries;
  }

  return buildTree(null);
}

export function getSectionChapterContext(
  nodes: LegalNode[],
  sectionId: string
): LegalNode | null {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  let current = nodeMap.get(sectionId);

  while (current) {
    if (current.nodeType === "chapter" && !isSubPartChapter(current)) {
      return current;
    }
    current = current.parentId ? nodeMap.get(current.parentId) : undefined;
  }

  return null;
}

export function getAdjacentSections(
  nodes: LegalNode[],
  currentSlugPath: string
): { prev: LegalNode | null; next: LegalNode | null } {
  const sections = nodes.filter(
    (n) => n.nodeType === "section" && n.slugPath
  );
  const idx = sections.findIndex((s) => s.slugPath === currentSlugPath);
  return {
    prev: idx > 0 ? sections[idx - 1] : null,
    next: idx < sections.length - 1 ? sections[idx + 1] : null,
  };
}

export async function getAllSlugs(type: "law" | "regulation") {
  return db
    .select({
      slug: schema.legalDocuments.slug,
    })
    .from(schema.legalDocuments)
    .where(and(eq(schema.legalDocuments.type, type), notAmendmentFilter));
}

export async function getAllSectionPaths() {
  return db
    .select({
      docSlug: schema.legalDocuments.slug,
      docType: schema.legalDocuments.type,
      sectionSlug: schema.legalNodes.slugPath,
      lastModified: sql<Date>`COALESCE(${schema.legalDocuments.sourceUpdatedAt}, ${schema.legalDocuments.importedAt})`,
    })
    .from(schema.legalNodes)
    .innerJoin(
      schema.legalDocuments,
      eq(schema.legalNodes.documentId, schema.legalDocuments.id)
    )
    .where(
      and(
        sql`${schema.legalNodes.slugPath} IS NOT NULL`,
        notAmendmentFilter
      )
    )
    .orderBy(asc(schema.legalDocuments.slug), asc(schema.legalNodes.slugPath));
}

export async function getSectionPathCount() {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.legalNodes)
    .innerJoin(
      schema.legalDocuments,
      eq(schema.legalNodes.documentId, schema.legalDocuments.id)
    )
    .where(
      and(
        sql`${schema.legalNodes.slugPath} IS NOT NULL`,
        notAmendmentFilter
      )
    );
  return row?.count ?? 0;
}

export async function getSectionPathsPage(offset: number, limit: number) {
  return db
    .select({
      docSlug: schema.legalDocuments.slug,
      docType: schema.legalDocuments.type,
      sectionSlug: schema.legalNodes.slugPath,
      lastModified: sql<Date>`COALESCE(${schema.legalDocuments.sourceUpdatedAt}, ${schema.legalDocuments.importedAt})`,
    })
    .from(schema.legalNodes)
    .innerJoin(
      schema.legalDocuments,
      eq(schema.legalNodes.documentId, schema.legalDocuments.id)
    )
    .where(
      and(
        sql`${schema.legalNodes.slugPath} IS NOT NULL`,
        notAmendmentFilter
      )
    )
    .orderBy(asc(schema.legalDocuments.slug), asc(schema.legalNodes.slugPath))
    .offset(offset)
    .limit(limit);
}

export async function getUnresolvedReferences(limit = 100) {
  return db
    .select({
      ref: schema.legalReferences,
      fromDoc: schema.legalDocuments,
    })
    .from(schema.legalReferences)
    .innerJoin(
      schema.legalDocuments,
      eq(schema.legalReferences.fromDocumentId, schema.legalDocuments.id)
    )
    .where(sql`${schema.legalReferences.confidence} < 0.75`)
    .limit(limit);
}

export type { LegalDocument, LegalNode };
