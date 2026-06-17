import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = pageMetadata({
  title: "Kilde og lisens",
  description: "Informasjon om datakilde og lisens for Lovspeil.",
  path: "/kilde-og-lisens",
});

export default function KildeOgLisensPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Kilde og lisens</h1>

      <div className="space-y-6 text-stone-700">
        <section>
          <h2 className="mb-2 text-xl font-semibold text-stone-900">Datakilde</h2>
          <p>
            Lovspeil henter data fra{" "}
            <a href="https://lovdata.no" className="text-blue-700 underline" rel="noopener noreferrer">
              Lovdata
            </a>
            , som er den autoritative kilden for norsk lovgivning.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-stone-900">Lisens</h2>
          <p>
            Data tilgjengeliggjøres under{" "}
            <a
              href="https://data.norge.no/nlod/en/2.0/"
              className="text-blue-700 underline"
              rel="noopener noreferrer"
            >
              Norsk lisens for offentlige data (NLOD) 2.0
            </a>
            .
          </p>
          <p className="mt-2">
            Du må kreditere Lovdata som kilde ved bruk av data fra Lovspeil.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-stone-900">Attribution</h2>
          <blockquote className="rounded-lg border border-stone-200 bg-stone-50 p-4 italic">
            Data hentet fra Lovdata. Tilgjengeliggjort under Norsk lisens for offentlige data
            (NLOD) 2.0.
          </blockquote>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-stone-900">API</h2>
          <p>
            For fremtidig synkronisering brukes Lovdata sitt offentlige API:{" "}
            <a
              href="https://api.lovdata.no/swagger"
              className="text-blue-700 underline"
              rel="noopener noreferrer"
            >
              api.lovdata.no
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
