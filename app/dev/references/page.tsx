import { getUnresolvedReferences } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dev: References",
  robots: { index: false, follow: false },
};

export default async function DevReferencesPage() {
  const refs = await getUnresolvedReferences(200);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Uoppløste referanser (dev)</h1>
      <p className="mb-6 text-sm text-stone-500">
        Referanser med confidence &lt; 0.75. Totalt vist: {refs.length}
      </p>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 pr-4">Fra</th>
            <th className="py-2 pr-4">Tekst</th>
            <th className="py-2 pr-4">Mål</th>
            <th className="py-2 pr-4">Confidence</th>
            <th className="py-2">Grunn</th>
          </tr>
        </thead>
        <tbody>
          {refs.map(({ ref, fromDoc }) => (
            <tr key={ref.id} className="border-b border-stone-100">
              <td className="py-2 pr-4">{fromDoc.shortTitle ?? fromDoc.slug}</td>
              <td className="py-2 pr-4 font-mono text-xs">{ref.rawText}</td>
              <td className="py-2 pr-4 font-mono text-xs">{ref.normalizedTarget}</td>
              <td className="py-2 pr-4">{ref.confidence.toFixed(2)}</td>
              <td className="py-2 text-stone-500">{ref.resolverReason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
