"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { DocumentType } from "@/types/legal";
import { buildDocumentUrl } from "@/lib/lovdata/slug";

export interface DocumentIndexItem {
  id: string;
  slug: string;
  title: string;
  shortTitle: string | null;
  date: string | null;
  number: string | null;
}

interface DocumentIndexProps {
  documents: DocumentIndexItem[];
  documentType: DocumentType;
}

export function DocumentIndex({ documents, documentType }: DocumentIndexProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((doc) => {
      const haystack = [doc.title, doc.shortTitle, doc.number, doc.date]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [documents, query]);

  const grouped = filtered.reduce<Record<string, DocumentIndexItem[]>>(
    (acc, doc) => {
      const letter = (doc.shortTitle ?? doc.title).charAt(0).toUpperCase();
      const key = /[A-ZÆØÅ]/i.test(letter) ? letter : "#";
      acc[key] = acc[key] ?? [];
      acc[key].push(doc);
      return acc;
    },
    {}
  );

  const letters = Object.keys(grouped).sort();

  return (
    <>
      <div className="mb-6">
        <label htmlFor="document-filter" className="sr-only">
          Filtrer dokumenter
        </label>
        <input
          id="document-filter"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrer i listen…"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
        {query && (
          <p className="mt-2 text-sm text-stone-500">
            {filtered.length} av {documents.length} treff
          </p>
        )}
      </div>

      <div className="space-y-8">
        {letters.map((letter) => (
          <section key={letter}>
            <h2 className="mb-3 border-b border-stone-200 pb-1 text-lg font-semibold text-stone-400">
              {letter}
            </h2>
            <ul className="space-y-1">
              {grouped[letter].map((doc) => (
                <li key={doc.id}>
                  <Link
                    href={buildDocumentUrl(documentType, doc.slug)}
                    className="block rounded px-2 py-1.5 hover:bg-stone-50"
                  >
                    <span className="font-medium text-stone-900">
                      {doc.shortTitle ?? doc.title}
                    </span>
                    {doc.shortTitle && (
                      <span className="ml-2 text-sm text-stone-500">
                        {doc.title}
                      </span>
                    )}
                    {(doc.date || doc.number) && (
                      <span className="ml-2 text-sm text-stone-400">
                        {[doc.date, doc.number && `nr. ${doc.number}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
