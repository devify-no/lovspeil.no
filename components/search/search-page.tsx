"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import type { SearchResult } from "@/types/legal";

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "all";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [directJump, setDirectJump] = useState<string | null>(null);

  useEffect(() => {
    if (!q.trim()) return;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data.results ?? []);
        if (data.directJump) {
          setDirectJump(data.directJump.url);
        }
      })
      .finally(() => setLoading(false));
  }, [q, type]);

  if (!q.trim()) {
    return (
      <p className="text-stone-500">Skriv inn et søkeord for å starte.</p>
    );
  }

  if (loading) {
    return <p className="text-stone-500">Søker…</p>;
  }

  return (
    <div>
      {directJump && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">
            Direkte treff:{" "}
            <Link href={directJump} className="font-medium underline">
              Gå til {q}
            </Link>
          </p>
        </div>
      )}

      {results.length === 0 ? (
        <p className="text-stone-500">Ingen resultater for «{q}».</p>
      ) : (
        <ul className="space-y-4">
          {results.map((result, i) => (
            <li key={i} className="rounded-lg border border-stone-200 p-4">
              <Link href={result.url} className="group">
                <h3 className="font-medium text-blue-700 group-hover:underline">
                  {result.sectionNumber
                    ? `${result.documentTitle} § ${result.sectionNumber}`
                    : result.documentTitle}
                  {result.sectionTitle && (
                    <span className="font-normal text-stone-600">
                      {" "}– {result.sectionTitle}
                    </span>
                  )}
                </h3>
                <p className="mt-1 text-sm text-stone-500">
                  {result.documentType === "law" ? "Lov" : "Forskrift"}
                </p>
                <p className="mt-2 text-sm text-stone-700">{result.snippet}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SearchPageClient() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "all";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Søk</h1>

      <form action="/sok" method="get" className="mb-6">
        <div className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Søk etter lov, forskrift eller paragraf…"
            className="flex-1 rounded-lg border border-stone-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-lg bg-stone-900 px-6 py-3 text-white hover:bg-stone-800"
          >
            Søk
          </button>
        </div>
        <div className="mt-3 flex gap-4 text-sm">
          {(["all", "law", "regulation"] as const).map((t) => (
            <label key={t} className="flex items-center gap-1.5">
              <input
                type="radio"
                name="type"
                value={t}
                defaultChecked={type === t}
              />
              {t === "all" ? "Alle" : t === "law" ? "Lover" : "Forskrifter"}
            </label>
          ))}
        </div>
      </form>

      <Suspense fallback={<p>Søker…</p>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
