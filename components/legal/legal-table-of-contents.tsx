import Link from "next/link";
import type { TocEntry } from "@/types/legal";
import type { DocumentType } from "@/types/legal";
import { buildDocumentUrl } from "@/lib/lovdata/slug";

interface LegalTableOfContentsProps {
  entries: TocEntry[];
  documentSlug: string;
  documentType: DocumentType;
  activeSlugPath?: string;
  activeAnchor?: string | null;
}

function TocItem({
  entry,
  documentSlug,
  documentType,
  activeSlugPath,
  activeAnchor,
  depth = 0,
}: {
  entry: TocEntry;
  documentSlug: string;
  documentType: DocumentType;
  activeSlugPath?: string;
  activeAnchor?: string | null;
  depth?: number;
}) {
  const href = entry.slugPath
    ? buildDocumentUrl(documentType, documentSlug, entry.slugPath)
    : `#${entry.anchor}`;
  const isActive =
    (activeAnchor && entry.anchor === activeAnchor) ||
    (activeSlugPath && entry.slugPath === activeSlugPath);

  return (
    <li>
      <Link
        href={href}
        data-toc-anchor={entry.anchor}
        className={`block rounded px-2 py-1 text-sm hover:bg-stone-100 ${
          isActive ? "bg-stone-100 font-medium text-stone-900" : "text-stone-600"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {entry.label}
      </Link>
      {entry.children.length > 0 && (
        <ul className="mt-0.5">
          {entry.children.map((child) => (
            <TocItem
              key={child.id}
              entry={child}
              documentSlug={documentSlug}
              documentType={documentType}
              activeSlugPath={activeSlugPath}
              activeAnchor={activeAnchor}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function LegalTableOfContents({
  entries,
  documentSlug,
  documentType,
  activeSlugPath,
  activeAnchor,
}: LegalTableOfContentsProps) {
  return (
    <nav aria-label="Innholdsfortegnelse" className="text-sm">
      <h2 className="mb-3 font-semibold text-stone-800">Innhold</h2>
      <ul className="space-y-0.5">
        {entries.map((entry) => (
          <TocItem
            key={entry.id}
            entry={entry}
            documentSlug={documentSlug}
            documentType={documentType}
            activeSlugPath={activeSlugPath}
            activeAnchor={activeAnchor}
          />
        ))}
      </ul>
    </nav>
  );
}
