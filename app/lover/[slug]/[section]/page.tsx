import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getDocumentBySlug,
  getDocumentNodes,
  getSectionBySlugPath,
  buildToc,
  getAdjacentSections,
  getDocumentLinkIndex,
} from "@/lib/queries";
import { buildDocumentUrl } from "@/lib/lovdata/slug";
import { Breadcrumbs } from "@/components/legal/document-metadata";
import {
  SectionNavigation,
  CopyLinkButton,
} from "@/components/legal/table-of-contents";
import { DocumentLayout } from "@/components/legal/document-layout";
import { SectionContent } from "@/components/legal/legal-content";

interface PageProps {
  params: Promise<{ slug: string; section: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, section } = await params;
  const doc = await getDocumentBySlug(slug);
  if (!doc || doc.type !== "law") return { title: "Ikke funnet" };

  const node = await getSectionBySlugPath(doc.id, section);
  const lawName = doc.shortTitle ?? doc.title;
  const sectionLabel = node?.number ?? `§ ${section}`;
  const sectionTitle = node?.title ?? "";

  const title = sectionTitle
    ? `${lawName} ${sectionLabel} – ${sectionTitle}`
    : `${lawName} ${sectionLabel}`;

  return {
    title,
    description: `Les ${sectionLabel}${sectionTitle ? `. ${sectionTitle}` : ""} i ${doc.title}.`,
    alternates: {
      canonical: buildDocumentUrl("law", doc.slug, section),
    },
  };
}

export const revalidate = 3600;

export default async function LovSectionPage({ params }: PageProps) {
  const { slug, section } = await params;
  const doc = await getDocumentBySlug(slug);
  if (!doc || doc.type !== "law") notFound();

  const node = await getSectionBySlugPath(doc.id, section);
  if (!node) notFound();

  const nodes = await getDocumentNodes(doc.id);
  const toc = buildToc(nodes);
  const linkIndex = await getDocumentLinkIndex();
  const { prev, next } = getAdjacentSections(nodes, section);
  const displayTitle = doc.shortTitle ?? doc.title;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Lover", href: "/lover" },
          { label: displayTitle, href: buildDocumentUrl("law", doc.slug) },
          { label: node.number ?? `§ ${section}` },
        ]}
      />

      <DocumentLayout
        entries={toc}
        documentSlug={doc.slug}
        documentType="law"
        activeSlugPath={section}
      >
        <div className="mb-4 flex justify-end">
          <CopyLinkButton anchor={node.anchor} />
        </div>

        <SectionContent
          node={node}
          lovdataUrl={node.lovdataUrl}
          linkIndex={linkIndex}
        />

        <SectionNavigation
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
          documentType="law"
        />
      </DocumentLayout>
    </div>
  );
}
