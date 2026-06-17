import Link from "next/link";
import type { LegalDocument, LegalNode } from "@/db/schema";
import type { DocumentLinkIndex } from "@/lib/lovdata/link-resolver";
import type { DocumentType, TocEntry } from "@/types/legal";
import { buildDocumentUrl } from "@/lib/lovdata/slug";
import { formatChapterHeading } from "@/lib/lovdata/node-display";
import { documentIntroText, sectionIntroText, capitalizeFirst } from "@/lib/seo/metadata";
import { buildDocumentJsonLd, buildSectionJsonLd } from "@/lib/seo/json-ld";
import {
  getChapterAnchor,
  getDocumentCanonicalUrl,
  getSectionCanonicalUrl,
} from "@/lib/seo/urls";
import { Breadcrumbs } from "@/components/legal/breadcrumbs";
import { DocumentLayout } from "@/components/legal/document-layout";
import {
  LegalContent,
  SectionContent,
} from "@/components/legal/legal-content";
import { LegalMetadataBox } from "@/components/legal/legal-metadata-box";
import { PreviousNextSectionNav } from "@/components/legal/previous-next-section-nav";
import { ShareButton } from "@/components/legal/share-button";
import { SourceDisclaimer } from "@/components/legal/source-disclaimer";
import { JsonLd } from "@/components/seo/json-ld";

interface DocumentPageProps {
  doc: LegalDocument;
  nodes: LegalNode[];
  toc: TocEntry[];
  linkIndex: DocumentLinkIndex;
  documentType: DocumentType;
}

export function DocumentPage({
  doc,
  nodes,
  toc,
  linkIndex,
  documentType,
}: DocumentPageProps) {
  const displayTitle = capitalizeFirst(doc.shortTitle ?? doc.title);
  const indexLabel = documentType === "law" ? "Lover" : "Forskrifter";
  const indexHref = documentType === "law" ? "/lover" : "/forskrifter";
  const documentUrl = getDocumentCanonicalUrl(documentType, doc.slug);
  const shareLabel =
    documentType === "law" ? "Del loven" : "Del forskriften";

  return (
    <>
      <JsonLd data={buildDocumentJsonLd(doc, documentType, displayTitle)} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Breadcrumbs
          items={[
            { label: indexLabel, href: indexHref },
            { label: displayTitle },
          ]}
        />

        <DocumentLayout
          entries={toc}
          documentSlug={doc.slug}
          documentType={documentType}
        >
          <article>
            <header className="mb-8">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-3xl font-bold text-stone-900">
                    {doc.title}
                  </h1>
                  {doc.shortTitle && doc.shortTitle !== doc.title && (
                    <p className="mt-1 text-lg text-stone-600">
                      {doc.shortTitle}
                    </p>
                  )}
                </div>
                <ShareButton url={documentUrl} label={shareLabel} />
              </div>

              <p className="mb-4 text-stone-600">{documentIntroText(doc)}</p>

              <LegalMetadataBox document={doc} documentType={documentType} />
              <SourceDisclaimer />
            </header>

            <LegalContent
              nodes={nodes}
              documentSlug={doc.slug}
              documentType={documentType}
              linkIndex={linkIndex}
            />
          </article>
        </DocumentLayout>
      </main>
    </>
  );
}

interface SectionReference {
  ref: {
    rawText: string;
    confidence: number;
  };
  targetDoc: LegalDocument | null;
  targetNode: LegalNode | null;
}

interface SectionPageProps {
  doc: LegalDocument;
  node: LegalNode;
  nodes: LegalNode[];
  toc: TocEntry[];
  linkIndex: DocumentLinkIndex;
  documentType: DocumentType;
  sectionSlug: string;
  prev: LegalNode | null;
  next: LegalNode | null;
  chapter: LegalNode | null;
  outgoingReferences: SectionReference[];
  incomingReferences: Array<{
    ref: { rawText: string; confidence: number };
    fromDoc: LegalDocument;
    fromNode: LegalNode | null;
  }>;
}

function ReferenceList({
  title,
  references,
}: {
  title: string;
  references: Array<{
    key: string;
    label: string;
    href: string;
  }>;
}) {
  if (references.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-2 text-base font-semibold text-stone-900">{title}</h2>
      <ul className="space-y-1 text-sm">
        {references.map((ref) => (
          <li key={ref.key}>
            <Link href={ref.href} className="text-blue-700 hover:underline">
              {ref.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SectionPage({
  doc,
  node,
  toc,
  linkIndex,
  documentType,
  sectionSlug,
  prev,
  next,
  chapter,
  outgoingReferences,
  incomingReferences,
}: SectionPageProps) {
  const displayTitle = capitalizeFirst(doc.shortTitle ?? doc.title);
  const indexLabel = documentType === "law" ? "Lover" : "Forskrifter";
  const indexHref = documentType === "law" ? "/lover" : "/forskrifter";
  const sectionUrl = getSectionCanonicalUrl(documentType, doc.slug, sectionSlug);
  const sectionLabel = node.number ?? `§ ${sectionSlug}`;
  const docUrl = buildDocumentUrl(documentType, doc.slug);

  const outgoingLinks = outgoingReferences
    .filter((r) => r.targetDoc && r.ref.confidence >= 0.5)
    .map((r) => {
      const targetType = r.targetDoc!.type;
      const href = r.targetNode?.slugPath
        ? buildDocumentUrl(targetType, r.targetDoc!.slug, r.targetNode.slugPath)
        : buildDocumentUrl(targetType, r.targetDoc!.slug);
      return {
        key: r.ref.rawText + href,
        label: r.ref.rawText,
        href,
      };
    });

  const incomingLinks = incomingReferences
    .filter((r) => r.ref.confidence >= 0.5)
    .map((r) => {
      const href = r.fromNode?.slugPath
        ? buildDocumentUrl(r.fromDoc.type, r.fromDoc.slug, r.fromNode.slugPath)
        : buildDocumentUrl(r.fromDoc.type, r.fromDoc.slug);
      return {
        key: r.ref.rawText + href,
        label: `${r.fromDoc.shortTitle ?? r.fromDoc.title}: ${r.ref.rawText}`,
        href,
      };
    });

  const chapterAnchor = chapter ? getChapterAnchor(chapter) : null;

  return (
    <>
      <JsonLd
        data={buildSectionJsonLd(
          doc,
          node,
          documentType,
          sectionSlug,
          displayTitle
        )}
      />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Breadcrumbs
          items={[
            { label: indexLabel, href: indexHref },
            { label: displayTitle, href: docUrl },
            { label: sectionLabel },
          ]}
        />

        <DocumentLayout
          entries={toc}
          documentSlug={doc.slug}
          documentType={documentType}
          activeSlugPath={sectionSlug}
        >
          <div className="mb-4 flex justify-end">
            <ShareButton url={sectionUrl} label="Del paragraf" />
          </div>

          {chapter && chapterAnchor && (
            <p className="mb-4 text-sm text-stone-600">
              <Link
                href={`${docUrl}#${chapterAnchor}`}
                className="text-blue-700 hover:underline"
              >
                {formatChapterHeading(chapter, 0)}
              </Link>
            </p>
          )}

          <p className="mb-6 text-sm text-stone-600">
            {sectionIntroText(doc, sectionSlug)}
          </p>

          <SectionContent
            node={node}
            lovdataUrl={node.lovdataUrl}
            linkIndex={linkIndex}
            documentTitle={displayTitle}
            sectionSlug={sectionSlug}
          />

          <ReferenceList
            title="Henvisninger fra denne paragrafen"
            references={outgoingLinks}
          />
          <ReferenceList
            title="Henvisninger til denne paragrafen"
            references={incomingLinks}
          />

          <SourceDisclaimer />

          <PreviousNextSectionNav
            prev={
              prev
                ? {
                    slugPath: prev.slugPath!,
                    title: prev.title,
                    number: prev.number,
                  }
                : null
            }
            next={
              next
                ? {
                    slugPath: next.slugPath!,
                    title: next.title,
                    number: next.number,
                  }
                : null
            }
            documentSlug={doc.slug}
            documentType={documentType}
            documentTitle={displayTitle}
          />
        </DocumentLayout>
      </main>
    </>
  );
}
