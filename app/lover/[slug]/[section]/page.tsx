import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getDocumentBySlug,
  getDocumentNodes,
  getSectionBySlugPath,
  buildToc,
  getAdjacentSections,
  getDocumentLinkIndex,
  getSectionChapterContext,
  getOutgoingReferences,
  getIncomingReferences,
} from "@/lib/queries";
import { generateSectionMetadata } from "@/lib/seo/metadata";
import { SectionPage } from "@/components/legal/document-page";

interface PageProps {
  params: Promise<{ slug: string; section: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, section } = await params;
  const doc = await getDocumentBySlug(slug);
  if (!doc || doc.type !== "law") return { title: "Ikke funnet" };

  const node = await getSectionBySlugPath(doc.id, section);
  if (!node) return { title: "Ikke funnet" };

  return generateSectionMetadata(doc, node, "law", section);
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
  const chapter = getSectionChapterContext(nodes, node.id);
  const outgoingReferences = await getOutgoingReferences(node.id);
  const incomingReferences = await getIncomingReferences(node.id);

  return (
    <SectionPage
      doc={doc}
      node={node}
      nodes={nodes}
      toc={toc}
      linkIndex={linkIndex}
      documentType="law"
      sectionSlug={section}
      prev={prev}
      next={next}
      chapter={chapter}
      outgoingReferences={outgoingReferences}
      incomingReferences={incomingReferences}
    />
  );
}
