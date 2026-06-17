import type { Metadata } from "next";
import { getAllDocuments } from "@/lib/queries";
import { pageMetadata } from "@/lib/seo/site";
import { DocumentIndex } from "@/components/legal/document-index";

export const metadata: Metadata = pageMetadata({
  title: "Lover",
  description:
    "Oversikt over norske lover på Lovspeil – gratis, uoffisiell og brukervennlig visning med kapitler, paragrafer og stabile lenker.",
  path: "/lover",
});

export const revalidate = 3600;

export default async function LoverPage() {
  const documents = await getAllDocuments("law");

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Lover</h1>
      <p className="mb-2 text-stone-600">
        Lovspeil er en gratis og uoffisiell visning av norske lover. Lovdata er
        autoritativ kilde. Her finner du lover med kapitler, paragrafer og
        stabile lenker til hver bestemmelse.
      </p>
      <p className="mb-6 text-sm text-stone-500">
        {documents.length} lover tilgjengelig
      </p>

      {documents.length === 0 ? (
        <p className="text-stone-500">
          Ingen lover importert ennå. Kjør <code>npm run import:xml nl</code>{" "}
          for å importere data.
        </p>
      ) : (
        <DocumentIndex
          documents={documents.map((doc) => ({
            id: doc.id,
            slug: doc.slug,
            title: doc.title,
            shortTitle: doc.shortTitle,
            date: doc.date,
            number: doc.number,
          }))}
          documentType="law"
        />
      )}
    </main>
  );
}
