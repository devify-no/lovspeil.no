import type { Metadata } from "next";
import Link from "next/link";
import { getAllDocuments } from "@/lib/queries";
import { buildDocumentUrl } from "@/lib/lovdata/slug";
import { DisclaimerBanner } from "@/components/layout/site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lover",
  description: "Oversikt over norske lover på Lovspeil.",
};

export const revalidate = 3600;

export default async function LoverPage() {
  const documents = await getAllDocuments("law");

  const grouped = documents.reduce<Record<string, typeof documents>>((acc, doc) => {
    const letter = (doc.shortTitle ?? doc.title).charAt(0).toUpperCase();
    const key = /[A-ZÆØÅ]/i.test(letter) ? letter : "#";
    acc[key] = acc[key] ?? [];
    acc[key].push(doc);
    return acc;
  }, {});

  const letters = Object.keys(grouped).sort();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Lover</h1>
      <p className="mb-6 text-stone-600">
        {documents.length} lover tilgjengelig
      </p>
      <div className="mb-6">
        <DisclaimerBanner />
      </div>

      {documents.length === 0 ? (
        <p className="text-stone-500">
          Ingen lover importert ennå. Kjør <code>npm run import:xml nl</code> for å importere data.
        </p>
      ) : (
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
                      href={buildDocumentUrl("law", doc.slug)}
                      className="block rounded px-2 py-1.5 hover:bg-stone-50"
                    >
                      <span className="font-medium text-stone-900">
                        {doc.shortTitle ?? doc.title}
                      </span>
                      {doc.shortTitle && (
                        <span className="ml-2 text-sm text-stone-500">{doc.title}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
