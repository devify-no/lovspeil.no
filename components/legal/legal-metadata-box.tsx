import type { LegalDocument } from "@/db/schema";
import type { DocumentType } from "@/types/legal";
import { formatDate } from "@/lib/utils";

interface LegalMetadataBoxProps {
  document: LegalDocument;
  documentType: DocumentType;
}

function documentTypeLabel(type: DocumentType): string {
  return type === "law" ? "Lov" : "Forskrift";
}

export function LegalMetadataBox({
  document,
  documentType,
}: LegalMetadataBoxProps) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm">
      <dl className="grid gap-2 sm:grid-cols-2">
        <dt className="font-medium text-stone-500">Dokumenttype</dt>
        <dd>{documentTypeLabel(documentType)}</dd>

        {document.date && (
          <>
            <dt className="font-medium text-stone-500">Dato</dt>
            <dd>{document.date}</dd>
          </>
        )}

        {document.number && (
          <>
            <dt className="font-medium text-stone-500">Nummer</dt>
            <dd>{document.number}</dd>
          </>
        )}

        <dt className="font-medium text-stone-500">Kilde</dt>
        <dd>Lovdata</dd>

        {document.ministry && (
          <>
            <dt className="font-medium text-stone-500">Departement</dt>
            <dd>{document.ministry}</dd>
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

        {document.sourceUpdatedAt && (
          <>
            <dt className="font-medium text-stone-500">Sist oppdatert i kilde</dt>
            <dd>{formatDate(document.sourceUpdatedAt)}</dd>
          </>
        )}

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
