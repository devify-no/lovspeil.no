import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getDocumentBySlug,
  getDocumentNodes,
  buildToc,
} from "@/lib/queries";
import { buildDocumentUrl } from "@/lib/lovdata/slug";
import { Breadcrumbs, DocumentMetadata } from "@/components/legal/document-metadata";
import { TableOfContents } from "@/components/legal/table-of-contents";
import { LegalContent } from "@/components/legal/legal-content";
import { DisclaimerBanner } from "@/components/layout/site-chrome";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getDocumentBySlug(slug);
  if (!doc || doc.type !== "regulation") return { title: "Ikke funnet" };

  const title = doc.shortTitle ?? doc.title;
  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    description: `Les ${doc.title} på Lovspeil.`,
    alternates: {
      canonical: buildDocumentUrl("regulation", doc.slug),
    },
  };
}

export const revalidate = 3600;

export default async function ForskriftPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = await getDocumentBySlug(slug);
  if (!doc || doc.type !== "regulation") notFound();

  const nodes = await getDocumentNodes(doc.id);
  const toc = buildToc(nodes);
  const displayTitle = doc.shortTitle ?? doc.title;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Forskrifter", href: "/forskrifter" },
          { label: displayTitle },
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
            />
          </div>
        </aside>

        <div className="min-w-0">
          <header className="mb-8">
            <h1 className="mb-4 text-3xl font-bold text-stone-900">{doc.title}</h1>
            <DocumentMetadata document={doc} />
          </header>

          <LegalContent nodes={nodes} />
        </div>
      </div>
    </div>
  );
}
