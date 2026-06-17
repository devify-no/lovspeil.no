import Link from "next/link";
import type { DocumentType } from "@/types/legal";
import { buildDocumentUrl } from "@/lib/lovdata/slug";

interface SectionNavItem {
  slugPath: string;
  title: string | null;
  number: string | null;
}

interface PreviousNextSectionNavProps {
  prev: SectionNavItem | null;
  next: SectionNavItem | null;
  documentSlug: string;
  documentType: DocumentType;
  documentTitle: string;
}

export function PreviousNextSectionNav({
  prev,
  next,
  documentSlug,
  documentType,
  documentTitle,
}: PreviousNextSectionNavProps) {
  const docUrl = buildDocumentUrl(documentType, documentSlug);
  const indexLabel = documentType === "law" ? "Lover" : "Forskrifter";
  const indexHref = documentType === "law" ? "/lover" : "/forskrifter";

  return (
    <nav
      aria-label="Navigasjon mellom paragrafer"
      className="mt-8 space-y-4 border-t border-stone-200 pt-6 text-sm"
    >
      <div className="flex justify-between gap-4">
        {prev ? (
          <Link
            href={buildDocumentUrl(documentType, documentSlug, prev.slugPath)}
            className="text-blue-700 hover:underline"
          >
            ← {prev.number ?? `§ ${prev.slugPath}`}
            {prev.title ? `. ${prev.title}` : ""}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={buildDocumentUrl(documentType, documentSlug, next.slugPath)}
            className="text-right text-blue-700 hover:underline"
          >
            {next.number ?? `§ ${next.slugPath}`}
            {next.title ? `. ${next.title}` : ""} →
          </Link>
        ) : (
          <span />
        )}
      </div>

      <p className="text-stone-600">
        <Link href={docUrl} className="text-blue-700 hover:underline">
          Tilbake til {documentTitle}
        </Link>
        {" · "}
        <Link href={indexHref} className="text-blue-700 hover:underline">
          {indexLabel}
        </Link>
      </p>
    </nav>
  );
}
