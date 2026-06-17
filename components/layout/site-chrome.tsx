import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-semibold text-stone-900">
          Lovspeil
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/lover" className="text-stone-600 hover:text-stone-900">
            Lover
          </Link>
          <Link href="/forskrifter" className="text-stone-600 hover:text-stone-900">
            Forskrifter
          </Link>
          <Link href="/sok" className="text-stone-600 hover:text-stone-900">
            Søk
          </Link>
          <Link href="/om" className="text-stone-600 hover:text-stone-900">
            Om
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-stone-600">
        <p className="mb-2 font-medium text-stone-800">
          Lovspeil er en uoffisiell visning av norske lover og forskrifter.
          Lovdata er autoritativ kilde. Kontroller alltid mot Lovdata ved juridisk bruk.
        </p>
        <p className="mb-4">
          Data hentet fra{" "}
          <a
            href="https://lovdata.no"
            className="underline hover:text-stone-900"
            rel="noopener noreferrer"
          >
            Lovdata
          </a>
          . Tilgjengeliggjort under{" "}
          <a
            href="https://data.norge.no/nlod/en"
            className="underline hover:text-stone-900"
            rel="noopener noreferrer"
          >
            Norsk lisens for offentlige data (NLOD) 2.0
          </a>
          .
        </p>
        <div className="flex gap-4">
          <Link href="/kilde-og-lisens" className="underline hover:text-stone-900">
            Kilde og lisens
          </Link>
          <Link href="/om" className="underline hover:text-stone-900">
            Om Lovspeil
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function DisclaimerBanner() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <strong>Uoffisiell kilde.</strong> Lovspeil er ikke offisiell. Kontroller alltid mot{" "}
      <a href="https://lovdata.no" className="underline" rel="noopener noreferrer">
        Lovdata
      </a>{" "}
      ved juridisk bruk.
    </div>
  );
}
