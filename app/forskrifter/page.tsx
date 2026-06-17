import type { Metadata } from "next";
import { getAllDocuments } from "@/lib/queries";
import { pageMetadata } from "@/lib/seo/site";
import { DocumentIndex } from "@/components/legal/document-index";

export const metadata: Metadata = pageMetadata({
  title: "Forskrifter",
  description:
    "Oversikt over sentrale norske forskrifter på Lovspeil – gratis, uoffisiell og brukervennlig visning med paragrafer og stabile lenker.",
  path: "/forskrifter",
});

export const revalidate = 3600;

export default async function ForskrifterPage() {
  const documents = await getAllDocuments("regulation");

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Forskrifter</h1>
      <p className="mb-2 text-stone-600">
        Lovspeil er en gratis og uoffisiell visning av sentrale norske
        forskrifter. Lovdata er autoritativ kilde. Her finner du forskrifter med
        kapitler, paragrafer og stabile lenker til hver bestemmelse.
      </p>
      <p className="mb-6 text-sm text-stone-500">
        {documents.length} forskrifter tilgjengelig
      </p>

      {documents.length === 0 ? (
        <p className="text-stone-500">
          Ingen forskrifter importert ennå. Kjør{" "}
          <code>npm run import:xml sf</code> for å importere data.
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
          documentType="regulation"
        />
      )}
    </main>
  );
}
