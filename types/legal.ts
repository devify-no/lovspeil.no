export type SourceType = "nl" | "sf";
export type DocumentType = "law" | "regulation";

export type LegalNodeType =
  | "part"
  | "chapter"
  | "section"
  | "subsection"
  | "paragraph"
  | "letter"
  | "text";

export type ReferenceType =
  | "same_document_section"
  | "external_document_section"
  | "document"
  | "chapter"
  | "unknown";

export interface LegalDocumentMeta {
  sourceType: SourceType;
  documentKey: string;
  lovdataId: string;
  title: string;
  shortTitle: string | null;
  abbreviation: string | null;
  slug: string;
  type: DocumentType;
  date: string | null;
  number: string | null;
  ministry: string | null;
  status: string | null;
  rawXmlPath: string;
  sourceUpdatedAt: Date | null;
  canonicalLovdataUrl: string | null;
  legalCitationForms: string[];
  legalAreas: string[];
  language: string;
}

export interface ParsedLegalNode {
  nodeType: LegalNodeType;
  number: string | null;
  title: string | null;
  plainText: string;
  html: string;
  order: number;
  anchor: string;
  slugPath: string | null;
  normalizedSectionNumber: string | null;
  lovdataUrl: string | null;
  children: ParsedLegalNode[];
}

export interface ParsedDocument {
  meta: LegalDocumentMeta;
  nodes: ParsedLegalNode[];
  explicitLinks: ExplicitLink[];
}

export interface ExplicitLink {
  href: string;
  text: string;
  fromAnchor: string;
  lovdataPath: string | null;
}

export interface DocumentAlias {
  documentId: string;
  alias: string;
  normalizedAlias: string;
  source: "title" | "shortTitle" | "abbreviation" | "manual" | "inferred";
}

export interface ResolvedReference {
  rawText: string;
  normalizedTarget: string;
  targetDocumentId: string | null;
  targetNodeId: string | null;
  confidence: number;
  referenceType: ReferenceType;
  resolverReason: string;
}

export interface SearchResult {
  documentId: string;
  documentSlug: string;
  documentTitle: string;
  documentType: DocumentType;
  nodeId: string | null;
  nodeAnchor: string | null;
  sectionNumber: string | null;
  sectionTitle: string | null;
  snippet: string;
  score: number;
  url: string;
}

export interface TocEntry {
  id: string;
  title: string;
  label: string;
  anchor: string;
  slugPath: string | null;
  sectionNumber: string | null;
  children: TocEntry[];
}
