import type { LegalNode } from "@/db/schema";

interface LegalContentProps {
  nodes: LegalNode[];
  showAll?: boolean;
  focusSectionId?: string;
}

function renderNode(node: LegalNode, depth = 0): React.ReactNode {
  const Tag = node.nodeType === "section" ? "section" : "div";
  const headingLevel = node.nodeType === "chapter" ? "h2" : node.nodeType === "section" ? "h3" : null;

  return (
    <Tag
      key={node.id}
      id={node.anchor}
      className={`legal-node legal-node--${node.nodeType} ${depth > 0 ? "ml-0" : ""}`}
    >
      {headingLevel === "h2" && node.title && (
        <h2 className="mb-4 mt-8 text-xl font-semibold text-stone-900 first:mt-0">
          {node.number ? `${node.number}. ` : ""}{node.title}
        </h2>
      )}
      {headingLevel === "h3" && (
        <h3 className="mb-3 mt-6 text-lg font-semibold text-stone-900">
          {node.number && <span className="mr-1">{node.number}.</span>}
          {node.title}
        </h3>
      )}
      {node.nodeType === "section" && node.html ? (
        <div
          className="legal-text prose-legal"
          dangerouslySetInnerHTML={{ __html: sanitizeLegalHtml(node.html) }}
        />
      ) : node.nodeType !== "chapter" && node.html ? (
        <div
          className="legal-text prose-legal text-stone-800"
          dangerouslySetInnerHTML={{ __html: sanitizeLegalHtml(node.html) }}
        />
      ) : null}
    </Tag>
  );
}

/**
 * Basic sanitization: strip script tags and event handlers.
 * Content comes from trusted Lovdata source.
 */
function sanitizeLegalHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}

export function LegalContent({ nodes, showAll = true, focusSectionId }: LegalContentProps) {
  const topLevel = nodes.filter((n) => !n.parentId);

  if (focusSectionId) {
    const focus = nodes.find((n) => n.id === focusSectionId);
    if (focus) {
      return (
        <div className="legal-content">
          {renderNode(focus)}
        </div>
      );
    }
  }

  function renderTree(nodeList: LegalNode[], parentId: string | null = null, depth = 0): React.ReactNode[] {
    return nodeList
      .filter((n) => n.parentId === parentId)
      .map((node) => (
        <div key={node.id}>
          {renderNode(node, depth)}
          {node.nodeType === "chapter" && renderTree(nodeList, node.id, depth + 1)}
        </div>
      ));
  }

  return (
    <div className="legal-content">
      {renderTree(nodes)}
    </div>
  );
}

export function SectionContent({ node, lovdataUrl }: { node: LegalNode; lovdataUrl?: string | null }) {
  return (
    <article className="legal-section">
      <header className="mb-4 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-stone-900">
          {node.number && <span>{node.number}. </span>}
          {node.title}
        </h1>
      </header>
      <div
        className="legal-text prose-legal max-w-none text-stone-800 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: sanitizeLegalHtml(node.html) }}
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
