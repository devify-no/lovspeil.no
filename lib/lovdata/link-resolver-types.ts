import type { DocumentType } from "@/types/legal";

export interface DocumentLinkTarget {
  slug: string;
  type: DocumentType;
  isAmendment: boolean;
}

export interface DocumentLinkIndex {
  byKey: Map<string, DocumentLinkTarget>;
  /** documentKey -> normalized section -> slugPath for URL */
  sectionsByKey: Map<string, Map<string, string>>;
  /** documentKey -> chapter number -> anchor id */
  chaptersByKey: Map<string, Map<string, string>>;
  /** normalized alias -> documentKey */
  aliasesByNormalized: Map<string, string>;
}
