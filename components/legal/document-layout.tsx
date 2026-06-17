"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { TocEntry } from "@/types/legal";
import type { DocumentType } from "@/types/legal";
import { LegalTableOfContents } from "@/components/legal/legal-table-of-contents";

function flattenToc(entries: TocEntry[]): TocEntry[] {
  const result: TocEntry[] = [];
  for (const entry of entries) {
    result.push(entry);
    result.push(...flattenToc(entry.children));
  }
  return result;
}

function useScrollSpy(sectionIds: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sectionIdsKey = useMemo(() => sectionIds.join("|"), [sectionIds]);

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-10% 0px -70% 0px", threshold: [0, 0.1, 0.5] }
    );

    for (const el of elements) observer.observe(el);

    return () => observer.disconnect();
  }, [sectionIds, sectionIdsKey]);

  return activeId;
}

interface DocumentLayoutProps {
  entries: TocEntry[];
  documentSlug: string;
  documentType: DocumentType;
  activeSlugPath?: string;
  children: ReactNode;
}

export function DocumentLayout({
  entries,
  documentSlug,
  documentType,
  activeSlugPath,
  children,
}: DocumentLayoutProps) {
  const flat = flattenToc(entries);
  const scrollTargets = flat.map((e) => e.anchor);
  const activeAnchor = useScrollSpy(scrollTargets);
  const tocRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeAnchor || !tocRef.current) return;
    const container = tocRef.current;
    const activeLink = container.querySelector(
      `[data-toc-anchor="${activeAnchor}"]`
    ) as HTMLElement | null;
    if (!activeLink) return;

    const containerHeight = container.clientHeight;
    const linkTop = activeLink.offsetTop;
    const linkHeight = activeLink.offsetHeight;
    const scrollTarget = linkTop - containerHeight / 2 + linkHeight / 2;

    container.scrollTo({ top: scrollTarget, behavior: "smooth" });
  }, [activeAnchor]);

  return (
    <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
      <aside className="hidden lg:block">
        <div
          ref={tocRef}
          className="toc-scroll sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto"
        >
          <LegalTableOfContents
            entries={entries}
            documentSlug={documentSlug}
            documentType={documentType}
            activeSlugPath={activeSlugPath}
            activeAnchor={activeAnchor}
          />
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
