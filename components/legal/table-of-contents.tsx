"use client";

import Link from "next/link";
import { useState } from "react";
import type { TocEntry } from "@/types/legal";
import type { DocumentType } from "@/types/legal";
import { buildDocumentUrl } from "@/lib/lovdata/slug";

interface TableOfContentsProps {
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
  const label = entry.label;

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
        {label}
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

export function TableOfContents({
  entries,
  documentSlug,
  documentType,
  activeSlugPath,
  activeAnchor,
}: TableOfContentsProps) {
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

interface CopyLinkButtonProps {
  anchor: string;
}

export function CopyLinkButton({ anchor }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${anchor}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="rounded border border-stone-200 px-2 py-1 text-xs text-stone-500 hover:bg-stone-50 hover:text-stone-800"
      aria-label="Kopier lenke til paragraf"
    >
      {copied ? "Kopiert!" : "Kopier lenke"}
    </button>
  );
}

interface SectionNavigationProps {
  prev: { slugPath: string; title: string | null; number: string | null } | null;
  next: { slugPath: string; title: string | null; number: string | null } | null;
  documentSlug: string;
  documentType: DocumentType;
}

export function SectionNavigation({
  prev,
  next,
  documentSlug,
  documentType,
}: SectionNavigationProps) {
  return (
    <nav className="mt-8 flex justify-between border-t border-stone-200 pt-6 text-sm">
      {prev ? (
        <Link
          href={buildDocumentUrl(documentType, documentSlug, prev.slugPath!)}
          className="text-blue-700 hover:underline"
        >
          ← § {prev.number ?? prev.slugPath}
          {prev.title ? `. ${prev.title}` : ""}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={buildDocumentUrl(documentType, documentSlug, next.slugPath!)}
          className="text-right text-blue-700 hover:underline"
        >
          § {next.number ?? next.slugPath}
          {next.title ? `. ${next.title}` : ""} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
