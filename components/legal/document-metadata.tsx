import Link from "next/link";
import type { LegalDocument } from "@/db/schema";
import { formatDate } from "@/lib/utils";

interface DocumentMetadataProps {
  document: LegalDocument;
}

export function DocumentMetadata({ document }: DocumentMetadataProps) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm">
      <dl className="grid gap-2 sm:grid-cols-2">
        {document.ministry && (
          <>
            <dt className="font-medium text-stone-500">Departement</dt>
            <dd>{document.ministry}</dd>
          </>
        )}
        {document.date && (
          <>
            <dt className="font-medium text-stone-500">Dato</dt>
            <dd>{document.date}</dd>
          </>
        )}
        {document.status && (
          <>
            <dt className="font-medium text-stone-500">I kraft</dt>
            <dd>{document.status}</dd>
          </>
        )}
        <dt className="font-medium text-stone-500">Sist importert</dt>
        <dd>{formatDate(document.importedAt)}</dd>
        {document.legalAreas.length > 0 && (
          <>
            <dt className="font-medium text-stone-500">Rettsområde</dt>
            <dd>{document.legalAreas.join(", ")}</dd>
          </>
        )}
      </dl>
      {document.canonicalLovdataUrl && (
        <div className="mt-3 border-t border-stone-200 pt-3">
          <a
            href={document.canonicalLovdataUrl}
            className="text-blue-700 underline hover:text-blue-900"
            rel="noopener noreferrer"
            target="_blank"
          >
            Vis på Lovdata ↗
          </a>
        </div>
      )}
    </div>
  );
}

interface BreadcrumbsProps {
  items: Array<{ label: string; href?: string }>;
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Brødsmulesti" className="mb-4 text-sm text-stone-500">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-stone-900 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-stone-800">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
