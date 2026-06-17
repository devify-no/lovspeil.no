import { db, schema } from "@/db";
import { eq, asc, and, ilike, sql } from "drizzle-orm";
import type { LegalDocument, LegalNode } from "@/db/schema";
import type { TocEntry } from "@/types/legal";

export async function getAllDocuments(type?: "law" | "regulation") {
  const query = db
    .select()
    .from(schema.legalDocuments)
    .orderBy(asc(schema.legalDocuments.title));

  if (type) {
    return query.where(eq(schema.legalDocuments.type, type));
  }
  return query;
}

export async function getDocumentBySlug(slug: string) {
  const [doc] = await db
    .select()
    .from(schema.legalDocuments)
    .where(eq(schema.legalDocuments.slug, slug))
    .limit(1);
  return doc ?? null;
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
  return db
    .select({
      ref: schema.legalReferences,
      targetDoc: schema.legalDocuments,
      targetNode: schema.legalNodes,
    })
    .from(schema.legalReferences)
    .innerJoin(
      schema.legalDocuments,
      eq(schema.legalReferences.fromDocumentId, schema.legalDocuments.id)
    )
    .leftJoin(
      schema.legalDocuments,
      eq(schema.legalReferences.targetDocumentId, schema.legalDocuments.id)
    )
    .leftJoin(
      schema.legalNodes,
      eq(schema.legalReferences.targetNodeId, schema.legalNodes.id)
    )
    .where(eq(schema.legalReferences.fromNodeId, nodeId));
}

export function buildToc(nodes: LegalNode[]): TocEntry[] {
  const nodeMap = new Map<string, LegalNode>();
  const childrenMap = new Map<string | null, LegalNode[]>();

  for (const node of nodes) {
    nodeMap.set(node.id, node);
    const parentId = node.parentId;
    const siblings = childrenMap.get(parentId) ?? [];
    siblings.push(node);
    childrenMap.set(parentId, siblings);
  }

  function buildTree(parentId: string | null): TocEntry[] {
    const children = childrenMap.get(parentId) ?? [];
    return children
      .filter((n) => n.nodeType === "chapter" || n.nodeType === "section")
      .map((node) => ({
        id: node.id,
        title: node.title ?? node.number ?? node.anchor,
        anchor: node.anchor,
        slugPath: node.slugPath,
        sectionNumber: node.normalizedSectionNumber,
        children: buildTree(node.id),
      }));
  }

  return buildTree(null);
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
    .where(eq(schema.legalDocuments.type, type));
}

export async function getAllSectionPaths() {
  return db
    .select({
      docSlug: schema.legalDocuments.slug,
      docType: schema.legalDocuments.type,
      sectionSlug: schema.legalNodes.slugPath,
    })
    .from(schema.legalNodes)
    .innerJoin(
      schema.legalDocuments,
      eq(schema.legalNodes.documentId, schema.legalDocuments.id)
    )
    .where(sql`${schema.legalNodes.slugPath} IS NOT NULL`);
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
