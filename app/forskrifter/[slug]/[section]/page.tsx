import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getDocumentBySlug,
  getDocumentNodes,
  getSectionBySlugPath,
  buildToc,
  getAdjacentSections,
} from "@/lib/queries";
import { buildDocumentUrl } from "@/lib/lovdata/slug";
import { Breadcrumbs } from "@/components/legal/document-metadata";
import { TableOfContents, SectionNavigation, CopyLinkButton } from "@/components/legal/table-of-contents";
import { SectionContent } from "@/components/legal/legal-content";
import { DisclaimerBanner } from "@/components/layout/site-chrome";

interface PageProps {
  params: Promise<{ slug: string; section: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, section } = await params;
  const doc = await getDocumentBySlug(slug);
  if (!doc || doc.type !== "regulation") return { title: "Ikke funnet" };

  const node = await getSectionBySlugPath(doc.id, section);
  const name = doc.shortTitle ?? doc.title;
  const sectionLabel = node?.number ?? `§ ${section}`;

  return {
    title: `${name} ${sectionLabel}`,
    description: `Les ${sectionLabel} i ${doc.title}.`,
    alternates: {
      canonical: buildDocumentUrl("regulation", doc.slug, section),
    },
  };
}

export const revalidate = 3600;

export default async function ForskriftSectionPage({ params }: PageProps) {
  const { slug, section } = await params;
  const doc = await getDocumentBySlug(slug);
  if (!doc || doc.type !== "regulation") notFound();

  const node = await getSectionBySlugPath(doc.id, section);
  if (!node) notFound();

  const nodes = await getDocumentNodes(doc.id);
  const toc = buildToc(nodes);
  const { prev, next } = getAdjacentSections(nodes, section);
  const displayTitle = doc.shortTitle ?? doc.title;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Forskrifter", href: "/forskrifter" },
          { label: displayTitle, href: buildDocumentUrl("regulation", doc.slug) },
          { label: node.number ?? `§ ${section}` },
        ]}
      />

      <div className="mb-6">
        <DisclaimerBanner />
      </div>

      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
            <TableOfContents
              entries={toc}
              documentSlug={doc.slug}
              documentType="regulation"
              activeSlugPath={section}
            />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex justify-end">
            <CopyLinkButton anchor={node.anchor} />
          </div>

          <SectionContent node={node} lovdataUrl={node.lovdataUrl} />

          <SectionNavigation
            prev={prev ? { slugPath: prev.slugPath!, title: prev.title, number: prev.number } : null}
            next={next ? { slugPath: next.slugPath!, title: next.title, number: next.number } : null}
            documentSlug={doc.slug}
            documentType="regulation"
          />
        </div>
      </div>
    </div>
  );
}
