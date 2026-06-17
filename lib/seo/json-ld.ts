import type { LegalDocument, LegalNode } from "@/db/schema";
import type { DocumentType } from "@/types/legal";
import { getSiteUrl } from "@/lib/seo/site";
import {
  getDocumentCanonicalUrl,
  getSectionCanonicalUrl,
} from "@/lib/seo/urls";

function indexPath(type: DocumentType): string {
  return type === "law" ? "/lover" : "/forskrifter";
}

function indexLabel(type: DocumentType): string {
  return type === "law" ? "Lover" : "Forskrifter";
}

export function buildDocumentJsonLd(
  doc: LegalDocument,
  type: DocumentType,
  displayTitle: string
) {
  const baseUrl = getSiteUrl();
  const pageUrl = getDocumentCanonicalUrl(type, doc.slug);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: doc.title,
        url: pageUrl,
        isPartOf: { "@type": "WebSite", name: "Lovspeil", url: baseUrl },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Forside",
            item: baseUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: indexLabel(type),
            item: `${baseUrl}${indexPath(type)}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: displayTitle,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "Legislation",
        name: doc.title,
        legislationIdentifier: doc.lovdataId,
        jurisdiction: "NO",
        url: pageUrl,
      },
    ],
  };
}

export function buildSectionJsonLd(
  doc: LegalDocument,
  node: LegalNode,
  type: DocumentType,
  sectionSlug: string,
  displayTitle: string
) {
  const baseUrl = getSiteUrl();
  const docUrl = getDocumentCanonicalUrl(type, doc.slug);
  const pageUrl = getSectionCanonicalUrl(type, doc.slug, sectionSlug);
  const sectionLabel = node.number ?? `§ ${sectionSlug}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: `${displayTitle} ${sectionLabel}`,
        url: pageUrl,
        isPartOf: { "@type": "WebSite", name: "Lovspeil", url: baseUrl },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Forside",
            item: baseUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: indexLabel(type),
            item: `${baseUrl}${indexPath(type)}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: displayTitle,
            item: docUrl,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: sectionLabel,
            item: pageUrl,
          },
        ],
      },
    ],
  };
}
