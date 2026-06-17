#!/usr/bin/env tsx
/**
 * Build cross-reference index from imported documents.
 */
import { db, schema } from "../db";
import { buildAliasIndex } from "../lib/lovdata/alias-index";
import {
  resolveExplicitLink,
  detectReferencesInText,
  type ReferenceContext,
  type DocumentLookupEntry,
  type NodeLookupEntry,
  type AliasLookupEntry,
} from "../lib/lovdata/reference-resolver";
import { eq } from "drizzle-orm";
import { parseLovdataHtml } from "../lib/lovdata/parser";
import { readFileSync } from "fs";
import { join } from "path";

async function buildReferenceIndex() {
  console.log("Loading documents...");
  const documents = await db.select().from(schema.legalDocuments);
  const allNodes = await db.select().from(schema.legalNodes);

  console.log(`Building alias index for ${documents.length} documents...`);
  const aliases = buildAliasIndex(documents);

  // Clear and rebuild aliases
  await db.delete(schema.documentAliases);
  if (aliases.length > 0) {
    await db.insert(schema.documentAliases).values(
      aliases.map((a) => ({
        documentId: a.documentId,
        alias: a.alias,
        normalizedAlias: a.normalizedAlias,
        source: a.source,
      }))
    );
  }

  // Build lookup maps
  const documentsByKey = new Map<string, DocumentLookupEntry>();
  const documentsById = new Map<string, DocumentLookupEntry>();
  const nodesByDocumentAndSection = new Map<string, Map<string, NodeLookupEntry>>();
  const aliasesByNormalized = new Map<string, AliasLookupEntry[]>();

  for (const doc of documents) {
    const entry: DocumentLookupEntry = {
      id: doc.id,
      slug: doc.slug,
      documentKey: doc.documentKey,
      type: doc.type as "law" | "regulation",
      title: doc.title,
      shortTitle: doc.shortTitle,
    };
    documentsByKey.set(doc.documentKey, entry);
    documentsById.set(doc.id, entry);
    nodesByDocumentAndSection.set(doc.id, new Map());
  }

  for (const node of allNodes) {
    if (node.normalizedSectionNumber) {
      const sectionMap = nodesByDocumentAndSection.get(node.documentId)!;
      sectionMap.set(node.normalizedSectionNumber, {
        id: node.id,
        documentId: node.documentId,
        normalizedSectionNumber: node.normalizedSectionNumber,
        anchor: node.anchor,
        slugPath: node.slugPath,
      });
    }
  }

  for (const alias of aliases) {
    const existing = aliasesByNormalized.get(alias.normalizedAlias) ?? [];
    existing.push({ documentId: alias.documentId, normalizedAlias: alias.normalizedAlias });
    aliasesByNormalized.set(alias.normalizedAlias, existing);
  }

  console.log("Clearing existing references...");
  await db.delete(schema.legalReferences);

  let refCount = 0;

  for (const doc of documents) {
    const docNodes = allNodes.filter((n) => n.documentId === doc.id);
    const sectionMap = nodesByDocumentAndSection.get(doc.id)!;

    const currentDocumentSections = new Map<string, NodeLookupEntry>();
    for (const [key, val] of sectionMap) {
      currentDocumentSections.set(key, val);
    }

    const context: ReferenceContext = {
      fromDocumentId: doc.id,
      fromNodeId: null,
      currentDocumentSections,
      documentsByKey,
      documentsById,
      aliasesByNormalized,
      nodesByDocumentAndSection,
    };

    // Process explicit links from raw XML
    try {
      const rawPath = join(process.cwd(), doc.rawXmlPath);
      const html = readFileSync(rawPath, "utf8");
      const parsed = parseLovdataHtml(html, {
        filePath: doc.rawXmlPath,
        sourceType: doc.sourceType as "nl" | "sf",
      });

      for (const link of parsed.explicitLinks) {
        const resolved = resolveExplicitLink(link.href, link.text, {
          ...context,
          fromNodeId: docNodes.find((n) => n.anchor === link.fromAnchor)?.id ?? null,
        });

        await db.insert(schema.legalReferences).values({
          fromDocumentId: doc.id,
          fromNodeId: docNodes.find((n) => n.anchor === link.fromAnchor)?.id ?? null,
          rawText: link.text,
          normalizedTarget: resolved.normalizedTarget,
          targetDocumentId: resolved.targetDocumentId,
          targetNodeId: resolved.targetNodeId,
          confidence: resolved.confidence,
          referenceType: resolved.referenceType,
          resolverReason: resolved.resolverReason,
        });
        refCount++;
      }
    } catch {
      // Skip if raw file unavailable
    }

    // Detect text references in section nodes
    for (const node of docNodes) {
      if (node.nodeType !== "section" && node.nodeType !== "paragraph") continue;

      const nodeContext = { ...context, fromNodeId: node.id };
      const refs = detectReferencesInText(node.plainText, nodeContext);

      for (const ref of refs) {
        await db.insert(schema.legalReferences).values({
          fromDocumentId: doc.id,
          fromNodeId: node.id,
          rawText: ref.rawText,
          normalizedTarget: ref.normalizedTarget,
          targetDocumentId: ref.targetDocumentId,
          targetNodeId: ref.targetNodeId,
          confidence: ref.confidence,
          referenceType: ref.referenceType,
          resolverReason: ref.resolverReason,
        });
        refCount++;
      }
    }
  }

  console.log(`Done: ${refCount} references indexed, ${aliases.length} aliases`);
  process.exit(0);
}

buildReferenceIndex().catch((err) => {
  console.error(err);
  process.exit(1);
});
