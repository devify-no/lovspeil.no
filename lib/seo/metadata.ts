import type { Metadata } from "next";
import type { LegalDocument, LegalNode } from "@/db/schema";
import type { DocumentType } from "@/types/legal";
import { absoluteUrl, siteName } from "@/lib/seo/site";
import {
  getDocumentCanonicalPath,
  getSectionCanonicalPath,
} from "@/lib/seo/urls";

export function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function documentDisplayTitle(doc: LegalDocument): string {
  return doc.shortTitle ?? doc.title;
}

export function generateDocumentMetadata(
  doc: LegalDocument,
  type: DocumentType
): Metadata {
  const shortTitle = documentDisplayTitle(doc);
  const canonical = getDocumentCanonicalPath(type, doc.slug);

  const titleParts = [capitalizeFirst(shortTitle)];
  if (doc.shortTitle && doc.title !== doc.shortTitle) {
    titleParts.push(doc.title);
  }
  const pageTitle = titleParts.join(" – ");

  const description =
    type === "law"
      ? `Les ${shortTitle} i en brukervennlig visning med kapitler, paragrafer, interne henvisninger og kilde til Lovdata.`
      : `Les ${shortTitle} med strukturert innholdsfortegnelse, paragrafer og stabile lenker til hver bestemmelse.`;

  const absoluteTitle = `${pageTitle} – ${siteName}`;

  return {
    title: pageTitle,
    description,
    alternates: { canonical },
    openGraph: {
      title: absoluteTitle,
      description,
      url: absoluteUrl(canonical),
      siteName,
      locale: "nb_NO",
      type: "article",
    },
    twitter: {
      card: "summary",
      title: absoluteTitle,
      description,
    },
  };
}

export function generateSectionMetadata(
  doc: LegalDocument,
  node: LegalNode,
  type: DocumentType,
  sectionSlug: string
): Metadata {
  const shortTitle = capitalizeFirst(documentDisplayTitle(doc));
  const sectionLabel = node.number ?? `§ ${sectionSlug}`;
  const sectionTitle = node.title?.trim() ?? "";

  const heading = sectionTitle
    ? `${shortTitle} ${sectionLabel} – ${sectionTitle}`
    : `${shortTitle} ${sectionLabel}`;

  const description = sectionTitle
    ? `Les ${shortTitle} ${sectionLabel} om ${sectionTitle}. Se lovtekst, kapittel, relaterte bestemmelser og kilde til Lovdata.`
    : `Les ${shortTitle} ${sectionLabel}. Se lovtekst, kapittel, relaterte bestemmelser og kilde til Lovdata.`;

  const canonical = getSectionCanonicalPath(type, doc.slug, sectionSlug);
  const absoluteTitle = `${heading} – ${siteName}`;

  return {
    title: heading,
    description,
    alternates: { canonical },
    openGraph: {
      title: absoluteTitle,
      description,
      url: absoluteUrl(canonical),
      siteName,
      locale: "nb_NO",
      type: "article",
    },
    twitter: {
      card: "summary",
      title: absoluteTitle,
      description,
    },
  };
}

export function documentIntroText(doc: LegalDocument): string {
  return `Denne siden viser ${doc.title} i en brukervennlig struktur med kapitler, paragrafer og stabile lenker til hver bestemmelse.`;
}

export function sectionIntroText(
  doc: LegalDocument,
  sectionSlug: string
): string {
  const shortTitle = documentDisplayTitle(doc);
  return `Denne siden viser ${shortTitle} § ${sectionSlug}. Bruk lenkene over og under bestemmelsen for å navigere til kapittel, forrige eller neste paragraf.`;
}
