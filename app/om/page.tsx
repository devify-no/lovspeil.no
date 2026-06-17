import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = pageMetadata({
  title: "Om Lovspeil",
  description:
    "Om Lovspeil – uoffisiell, leservennlig tilgang til norske lover og forskrifter.",
  path: "/om",
});

export default function OmPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Om Lovspeil</h1>

      <div className="prose-legal space-y-4 text-stone-700">
        <p>
          Lovspeil er en gratis, uoffisiell plattform for å lese norske lover og
          sentrale forskrifter. Målet er å gjøre lovtekster enklere å navigere
          og lese enn på Lovdata, med klikkbare kryssreferanser og rene URL-er
          for hver paragraf.
        </p>
        <p>
          Inspirert av{" "}
          <a
            href="https://lagen.nu"
            className="text-blue-700 underline"
            rel="noopener noreferrer"
          >
            lagen.nu
          </a>{" "}
          i Sverige, men for norsk rett.
        </p>
        <h2 className="text-xl font-semibold text-stone-900">Ikke offisiell</h2>
        <p>
          Lovspeil er <strong>ikke</strong> en offisiell kilde. Lovdata er den
          autoritative kilden for norsk lovgivning. Kontroller alltid mot
          Lovdata ved juridisk bruk.
        </p>
        <h2 className="text-xl font-semibold text-stone-900">Kilde</h2>
        <p>
          All data hentes fra Lovdata og tilgjengeliggjøres under{" "}
          <a
            href="https://data.norge.no/nlod/en"
            className="text-blue-700 underline"
            rel="noopener noreferrer"
          >
            Norsk lisens for offentlige data (NLOD) 2.0
          </a>
          .
        </p>
        <h2 className="text-xl font-semibold text-stone-900">Kode</h2>
        <p>
          Kildekoden er tilgjengelig på{" "}
          <a
            href="https://github.com/devify-no/lovspeil.no"
            className="text-blue-700 underline"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          .
        </p>
      </div>
    </div>
  );
}
