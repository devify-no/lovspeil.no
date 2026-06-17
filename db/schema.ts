import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  uuid,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const sourceTypeEnum = pgEnum("source_type", ["nl", "sf"]);
export const documentTypeEnum = pgEnum("document_type", ["law", "regulation"]);
export const nodeTypeEnum = pgEnum("node_type", [
  "part",
  "chapter",
  "section",
  "subsection",
  "paragraph",
  "letter",
  "text",
]);
export const referenceTypeEnum = pgEnum("reference_type", [
  "same_document_section",
  "external_document_section",
  "document",
  "chapter",
  "unknown",
]);
export const aliasSourceEnum = pgEnum("alias_source", [
  "title",
  "shortTitle",
  "abbreviation",
  "manual",
  "inferred",
]);

export const legalDocuments = pgTable(
  "legal_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceType: sourceTypeEnum("source_type").notNull(),
    documentKey: text("document_key").notNull(),
    lovdataId: text("lovdata_id").notNull(),
    title: text("title").notNull(),
    shortTitle: text("short_title"),
    abbreviation: text("abbreviation"),
    slug: text("slug").notNull(),
    type: documentTypeEnum("type").notNull(),
    date: text("date"),
    number: text("number"),
    ministry: text("ministry"),
    status: text("status"),
    rawXmlPath: text("raw_xml_path").notNull(),
    sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }),
    importedAt: timestamp("imported_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    canonicalLovdataUrl: text("canonical_lovdata_url"),
    legalCitationForms: text("legal_citation_forms")
      .array()
      .notNull()
      .default([]),
    legalAreas: text("legal_areas").array().notNull().default([]),
    language: text("language").notNull().default("nb"),
    searchVector: text("search_vector"),
  },
  (table) => [
    uniqueIndex("legal_documents_document_key_idx").on(table.documentKey),
    uniqueIndex("legal_documents_slug_idx").on(table.slug),
    index("legal_documents_type_idx").on(table.type),
    index("legal_documents_source_type_idx").on(table.sourceType),
  ]
);

export const legalNodes = pgTable(
  "legal_nodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => legalDocuments.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"),
    nodeType: nodeTypeEnum("node_type").notNull(),
    number: text("number"),
    title: text("title"),
    plainText: text("plain_text").notNull().default(""),
    html: text("html").notNull().default(""),
    order: integer("order").notNull(),
    anchor: text("anchor").notNull(),
    slugPath: text("slug_path"),
    normalizedSectionNumber: text("normalized_section_number"),
    lovdataUrl: text("lovdata_url"),
    searchVector: text("search_vector"),
  },
  (table) => [
    index("legal_nodes_document_id_idx").on(table.documentId),
    index("legal_nodes_parent_id_idx").on(table.parentId),
    index("legal_nodes_anchor_idx").on(table.documentId, table.anchor),
    uniqueIndex("legal_nodes_slug_path_idx").on(
      table.documentId,
      table.slugPath
    ),
    index("legal_nodes_section_number_idx").on(
      table.documentId,
      table.normalizedSectionNumber
    ),
  ]
);

export const documentAliases = pgTable(
  "document_aliases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => legalDocuments.id, { onDelete: "cascade" }),
    alias: text("alias").notNull(),
    normalizedAlias: text("normalized_alias").notNull(),
    source: aliasSourceEnum("source").notNull(),
  },
  (table) => [
    index("document_aliases_normalized_idx").on(table.normalizedAlias),
    uniqueIndex("document_aliases_unique_idx").on(
      table.documentId,
      table.normalizedAlias
    ),
  ]
);

export const legalReferences = pgTable(
  "legal_references",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromDocumentId: uuid("from_document_id")
      .notNull()
      .references(() => legalDocuments.id, { onDelete: "cascade" }),
    fromNodeId: uuid("from_node_id").references(() => legalNodes.id, {
      onDelete: "cascade",
    }),
    rawText: text("raw_text").notNull(),
    normalizedTarget: text("normalized_target").notNull(),
    targetDocumentId: uuid("target_document_id").references(
      () => legalDocuments.id,
      { onDelete: "set null" }
    ),
    targetNodeId: uuid("target_node_id").references(() => legalNodes.id, {
      onDelete: "set null",
    }),
    confidence: real("confidence").notNull(),
    referenceType: referenceTypeEnum("reference_type").notNull(),
    resolverReason: text("resolver_reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("legal_references_from_doc_idx").on(table.fromDocumentId),
    index("legal_references_from_node_idx").on(table.fromNodeId),
    index("legal_references_target_doc_idx").on(table.targetDocumentId),
    index("legal_references_confidence_idx").on(table.confidence),
  ]
);

export const legalDocumentsRelations = relations(
  legalDocuments,
  ({ many }) => ({
    nodes: many(legalNodes),
    aliases: many(documentAliases),
    outgoingReferences: many(legalReferences, {
      relationName: "fromDocument",
    }),
    incomingReferences: many(legalReferences, {
      relationName: "targetDocument",
    }),
  })
);

export const legalNodesRelations = relations(legalNodes, ({ one, many }) => ({
  document: one(legalDocuments, {
    fields: [legalNodes.documentId],
    references: [legalDocuments.id],
  }),
  parent: one(legalNodes, {
    fields: [legalNodes.parentId],
    references: [legalNodes.id],
    relationName: "parentChild",
  }),
  children: many(legalNodes, { relationName: "parentChild" }),
}));

export const documentAliasesRelations = relations(
  documentAliases,
  ({ one }) => ({
    document: one(legalDocuments, {
      fields: [documentAliases.documentId],
      references: [legalDocuments.id],
    }),
  })
);

export const legalReferencesRelations = relations(
  legalReferences,
  ({ one }) => ({
    fromDocument: one(legalDocuments, {
      fields: [legalReferences.fromDocumentId],
      references: [legalDocuments.id],
      relationName: "fromDocument",
    }),
    fromNode: one(legalNodes, {
      fields: [legalReferences.fromNodeId],
      references: [legalNodes.id],
    }),
    targetDocument: one(legalDocuments, {
      fields: [legalReferences.targetDocumentId],
      references: [legalDocuments.id],
      relationName: "targetDocument",
    }),
    targetNode: one(legalNodes, {
      fields: [legalReferences.targetNodeId],
      references: [legalNodes.id],
    }),
  })
);

export type LegalDocument = typeof legalDocuments.$inferSelect;
export type LegalNode = typeof legalNodes.$inferSelect;
export type DocumentAlias = typeof documentAliases.$inferSelect;
export type LegalReference = typeof legalReferences.$inferSelect;

export type NewLegalDocument = typeof legalDocuments.$inferInsert;
export type NewLegalNode = typeof legalNodes.$inferInsert;
export type NewDocumentAlias = typeof documentAliases.$inferInsert;
export type NewLegalReference = typeof legalReferences.$inferInsert;
