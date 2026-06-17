import Link from "next/link";
import { DisclaimerBanner } from "@/components/layout/site-chrome";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-stone-900">
          Lovspeil
        </h1>
        <p className="text-xl text-stone-600">
          Gratis, leservennlig tilgang til norske lover og sentrale forskrifter.
        </p>
      </div>

      <div className="mb-8">
        <DisclaimerBanner />
      </div>

      <div className="mb-10">
        <form action="/sok" method="get" className="flex gap-2">
          <input
            type="search"
            name="q"
            placeholder="Søk etter lov, forskrift eller paragraf…"
            className="flex-1 rounded-lg border border-stone-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            className="rounded-lg bg-stone-900 px-6 py-3 text-white hover:bg-stone-800"
          >
            Søk
          </button>
        </form>
        <p className="mt-2 text-sm text-stone-500">
          Prøv f.eks. «aksjeloven § 3-1» eller «forvaltningsloven § 11»
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/lover"
          className="rounded-xl border border-stone-200 p-6 hover:border-stone-300 hover:shadow-sm"
        >
          <h2 className="mb-2 text-xl font-semibold">Lover</h2>
          <p className="text-stone-600">
            Bla gjennom norske lover med klikkbare paragrafer og kryssreferanser.
          </p>
        </Link>
        <Link
          href="/forskrifter"
          className="rounded-xl border border-stone-200 p-6 hover:border-stone-300 hover:shadow-sm"
        >
          <h2 className="mb-2 text-xl font-semibold">Forskrifter</h2>
          <p className="text-stone-600">
            Sentrale forskrifter med samme leservennlige format.
          </p>
        </Link>
      </div>
    </div>
  );
}
