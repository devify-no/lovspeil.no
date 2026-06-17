import type { LegalNode } from "@/db/schema";
import type { DocumentLinkIndex } from "@/lib/lovdata/link-resolver";
import { enrichLinksInHtml } from "@/lib/lovdata/link-resolver";
import {
  formatChapterHeading,
  formatSectionHeading,
  headingClass,
  headingLevel,
  stripArticleHeader,
} from "@/lib/lovdata/node-display";
import { enhanceFootnotes } from "@/lib/lovdata/footnotes";

interface LegalContentProps {
  nodes: LegalNode[];
  showAll?: boolean;
  focusSectionId?: string;
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

function renderHeading(
  node: LegalNode,
  depth: number
): React.ReactNode {
  const level = headingLevel(node.nodeType, depth);
  if (!level) return null;

  const text =
    node.nodeType === "chapter"
      ? formatChapterHeading(node, depth)
      : formatSectionHeading(node);

  if (!text) return null;

  if (level === "h2") {
    return <h2 className={headingClass.h2}>{text}</h2>;
  }
  if (level === "h3") {
    return <h3 className={headingClass.h3}>{text}</h3>;
  }
  return <h4 className={headingClass.h4}>{text}</h4>;
}

function renderNode(
  node: LegalNode,
  linkIndex: DocumentLinkIndex,
  depth = 0
): React.ReactNode {
  const Tag = node.nodeType === "section" ? "section" : "div";
  const showHtml =
    node.nodeType === "section" ||
    (node.nodeType !== "chapter" && node.html);

  return (
    <Tag
      key={node.id}
      id={node.anchor}
      className={`legal-node legal-node--${node.nodeType}`}
    >
      {renderHeading(node, depth)}
      {showHtml && node.html ? (
        <div
          className="legal-text prose-legal text-stone-800"
          dangerouslySetInnerHTML={{
            __html: prepareHtml(node.html, linkIndex, {
              stripHeader: node.nodeType === "section",
              anchor: node.anchor,
            }),
          }}
        />
      ) : null}
    </Tag>
  );
}

export function LegalContent({
  nodes,
  focusSectionId,
  linkIndex,
}: LegalContentProps) {
  if (focusSectionId) {
    const focus = nodes.find((n) => n.id === focusSectionId);
    if (focus) {
      return (
        <div className="legal-content">
          {renderNode(focus, linkIndex)}
        </div>
      );
    }
  }

  function renderTree(
    nodeList: LegalNode[],
    parentId: string | null = null,
    depth = 0
  ): React.ReactNode[] {
    return nodeList
      .filter((n) => n.parentId === parentId)
      .sort((a, b) => a.order - b.order)
      .map((node) => (
        <div key={node.id}>
          {renderNode(node, linkIndex, depth)}
          {(node.nodeType === "chapter") &&
            renderTree(nodeList, node.id, depth + 1)}
        </div>
      ));
  }

  return <div className="legal-content">{renderTree(nodes)}</div>;
}

export function SectionContent({
  node,
  lovdataUrl,
  linkIndex,
}: {
  node: LegalNode;
  lovdataUrl?: string | null;
  linkIndex: DocumentLinkIndex;
}) {
  return (
    <article className="legal-section">
      <header className="mb-4 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-stone-900">
          {formatSectionHeading(node)}
        </h1>
      </header>
      <div
        className="legal-text prose-legal max-w-none leading-relaxed text-stone-800"
        dangerouslySetInnerHTML={{
          __html: prepareHtml(node.html, linkIndex, {
            stripHeader: true,
            anchor: node.anchor,
          }),
        }}
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
