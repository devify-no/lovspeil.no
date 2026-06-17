import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getDocumentBySlug,
  getDocumentNodes,
  buildToc,
  getDocumentLinkIndex,
} from "@/lib/queries";
import { generateDocumentMetadata } from "@/lib/seo/metadata";
import { DocumentPage } from "@/components/legal/document-page";
import { generateRegulationSlugParams } from "@/lib/static-params";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getDocumentBySlug(slug);
  if (!doc || doc.type !== "regulation") return { title: "Ikke funnet" };
  return generateDocumentMetadata(doc, "regulation");
}

export const generateStaticParams = generateRegulationSlugParams;

export const revalidate = 3600;

export default async function ForskriftPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = await getDocumentBySlug(slug);
  if (!doc || doc.type !== "regulation") notFound();

  const nodes = await getDocumentNodes(doc.id);
  const toc = buildToc(nodes);
  const linkIndex = await getDocumentLinkIndex();

  return (
    <DocumentPage
      doc={doc}
      nodes={nodes}
      toc={toc}
      linkIndex={linkIndex}
      documentType="regulation"
    />
  );
}
