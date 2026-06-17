import type { LegalNode } from "@/db/schema";
import type { DocumentLinkIndex } from "@/lib/lovdata/link-resolver";
import type { DocumentType } from "@/types/legal";
import { enrichLinksInHtml } from "@/lib/lovdata/link-resolver";
import { stripArticleHeader } from "@/lib/lovdata/node-display";
import { enhanceFootnotes } from "@/lib/lovdata/footnotes";
import {
  getChapterAnchor,
  getChapterShareUrl,
  getSectionAnchor,
  getSectionCanonicalUrl,
} from "@/lib/seo/urls";
import { LegalChapter } from "@/components/legal/legal-chapter";
import { LegalSection } from "@/components/legal/legal-section";

interface LegalContentProps {
  nodes: LegalNode[];
  documentSlug: string;
  documentType: DocumentType;
  linkIndex: DocumentLinkIndex;
}

function prepareHtml(
  html: string,
  linkIndex: DocumentLinkIndex,
  options: { stripHeader: boolean; anchor: string }
): string {
  const sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
  const body = options.stripHeader ? stripArticleHeader(sanitized) : sanitized;
  return enrichLinksInHtml(enhanceFootnotes(body, options.anchor), linkIndex);
}

export function LegalContent({
  nodes,
  documentSlug,
  documentType,
  linkIndex,
}: LegalContentProps) {
  function renderTree(
    nodeList: LegalNode[],
    parentId: string | null = null,
    depth = 0
  ): React.ReactNode[] {
    return nodeList
      .filter((n) => n.parentId === parentId)
      .sort((a, b) => a.order - b.order)
      .map((node) => {
        if (node.nodeType === "chapter") {
          const chapterAnchor = getChapterAnchor(node);
          const chapterShareUrl = getChapterShareUrl(
            documentType,
            documentSlug,
            chapterAnchor
          );

          return (
            <LegalChapter
              key={node.id}
              node={node}
              depth={depth}
              shareUrl={chapterShareUrl}
            >
              {renderTree(nodeList, node.id, depth + 1)}
            </LegalChapter>
          );
        }

        if (node.nodeType === "section") {
          const sectionAnchor = getSectionAnchor(node);
          const hashShareUrl = getChapterShareUrl(
            documentType,
            documentSlug,
            sectionAnchor
          );
          const sectionShareUrl = node.slugPath
            ? getSectionCanonicalUrl(documentType, documentSlug, node.slugPath)
            : hashShareUrl;

          return (
            <LegalSection
              key={node.id}
              node={node}
              depth={depth}
              documentSlug={documentSlug}
              documentType={documentType}
              sectionShareUrl={sectionShareUrl}
              hashShareUrl={hashShareUrl}
              html={prepareHtml(node.html, linkIndex, {
                stripHeader: true,
                anchor: sectionAnchor,
              })}
            />
          );
        }

        return null;
      })
      .filter(Boolean);
  }

  return <div className="legal-content">{renderTree(nodes)}</div>;
}

export function SectionContent({
  node,
  lovdataUrl,
  linkIndex,
  documentTitle,
  sectionSlug,
}: {
  node: LegalNode;
  lovdataUrl?: string | null;
  linkIndex: DocumentLinkIndex;
  documentTitle: string;
  sectionSlug: string;
}) {
  const sectionAnchor = getSectionAnchor(node);
  const html = prepareHtml(node.html, linkIndex, {
    stripHeader: true,
    anchor: sectionAnchor,
  });

  const sectionLabel = node.number ?? `§ ${sectionSlug}`;
  const heading = node.title
    ? `${documentTitle} ${sectionLabel} – ${node.title}`
    : `${documentTitle} ${sectionLabel}`;

  return (
    <article className="legal-section">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-stone-900">{heading}</h1>
      </header>
      <div
        className="legal-text prose-legal max-w-none leading-relaxed text-stone-800"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {lovdataUrl && (
        <p className="mt-6 text-sm">
          <a
            href={`https://lovdata.no/${lovdataUrl}`}
            className="text-blue-700 underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            Vis på Lovdata ↗
          </a>
        </p>
      )}
    </article>
  );
}
