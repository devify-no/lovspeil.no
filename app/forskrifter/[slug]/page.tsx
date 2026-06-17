import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getDocumentBySlug,
  getDocumentNodes,
  buildToc,
  getDocumentLinkIndex,
} from "@/lib/queries";
import { buildDocumentUrl } from "@/lib/lovdata/slug";
import { absoluteUrl } from "@/lib/seo/site";
import {
  Breadcrumbs,
  DocumentMetadata,
} from "@/components/legal/document-metadata";
import { DocumentLayout } from "@/components/legal/document-layout";
import { LegalContent } from "@/components/legal/legal-content";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getDocumentBySlug(slug);
  if (!doc || doc.type !== "regulation") return { title: "Ikke funnet" };

  const title = doc.shortTitle ?? doc.title;
  const canonical = buildDocumentUrl("regulation", doc.slug);
  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    description: `Les ${doc.title} på Lovspeil.`,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${title} – Lovspeil`,
      description: doc.title,
      url: absoluteUrl(canonical),
      type: "article",
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
  const linkIndex = await getDocumentLinkIndex();
  const displayTitle = doc.shortTitle ?? doc.title;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Forskrifter", href: "/forskrifter" },
          { label: displayTitle },
        ]}
      />

      <DocumentLayout
        entries={toc}
        documentSlug={doc.slug}
        documentType="regulation"
      >
        <header className="mb-8">
          <h1 className="mb-4 text-3xl font-bold text-stone-900">
            {doc.title}
          </h1>
          <DocumentMetadata document={doc} />
        </header>

        <LegalContent nodes={nodes} linkIndex={linkIndex} />
      </DocumentLayout>
    </div>
  );
}
