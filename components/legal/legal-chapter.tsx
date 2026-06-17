import type { LegalNode } from "@/db/schema";
import {
  formatChapterHeading,
  headingClass,
} from "@/lib/lovdata/node-display";
import { ShareButton } from "@/components/legal/share-button";

interface LegalChapterProps {
  node: LegalNode;
  depth: number;
  shareUrl: string;
  children?: React.ReactNode;
}

export function LegalChapter({
  node,
  depth,
  shareUrl,
  children,
}: LegalChapterProps) {
  const text = formatChapterHeading(node, depth);
  if (!text) return null;

  const anchor = shareUrl.split("#")[1] ?? node.anchor;
  const HeadingTag = depth === 0 ? "h2" : "h3";
  const headingClassName = depth === 0 ? headingClass.h2 : headingClass.h3;

  return (
    <section id={anchor} className="legal-node legal-node--chapter scroll-mt-24">
      <div className="mb-2 flex items-start justify-between gap-3">
        <HeadingTag className={`${headingClassName} mb-0 mt-0`}>
          {text}
        </HeadingTag>
        <ShareButton url={shareUrl} label="Del kapittel" />
      </div>
      {children}
    </section>
  );
}
