import Link from "next/link";
import type { LegalNode } from "@/db/schema";
import type { DocumentType } from "@/types/legal";
import {
  formatSectionHeading,
  headingClass,
  headingLevel,
} from "@/lib/lovdata/node-display";
import { buildDocumentUrl } from "@/lib/lovdata/slug";
import { ShareButton } from "@/components/legal/share-button";

interface LegalSectionProps {
  node: LegalNode;
  depth: number;
  documentSlug: string;
  documentType: DocumentType;
  sectionShareUrl: string;
  hashShareUrl: string;
  html: string;
}

export function LegalSection({
  node,
  depth,
  documentSlug,
  documentType,
  sectionShareUrl,
  hashShareUrl,
  html,
}: LegalSectionProps) {
  const text = formatSectionHeading(node);
  const level = headingLevel(node.nodeType, depth);
  const anchor = hashShareUrl.split("#")[1] ?? node.anchor;
  const sectionPageUrl =
    node.slugPath &&
    buildDocumentUrl(documentType, documentSlug, node.slugPath);

  const headingContent = (
    <span className="group flex flex-wrap items-baseline gap-x-2 gap-y-1">
      {text}
      {sectionPageUrl && (
        <Link
          href={sectionPageUrl}
          className="text-sm font-normal text-blue-700 hover:underline"
        >
          egen side
        </Link>
      )}
    </span>
  );

  return (
    <section
      id={anchor}
      className="legal-node legal-node--section scroll-mt-24"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        {level === "h3" ? (
          <h3 className={`${headingClass.h3} mb-0 mt-0`}>{headingContent}</h3>
        ) : (
          <h4 className={`${headingClass.h4} mb-0 mt-0`}>{headingContent}</h4>
        )}
        <ShareButton url={sectionShareUrl} label="Del paragraf" />
      </div>
      <div
        className="legal-text prose-legal text-stone-800"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
