import Link from "next/link";
import { SiteLogoLink } from "@/components/layout/site-logo";

export function SiteHeader() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <SiteLogoLink />
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/lover" className="text-stone-600 hover:text-stone-900">
            Lover
          </Link>
          <Link
            href="/forskrifter"
            className="text-stone-600 hover:text-stone-900"
          >
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
          Lovdata er autoritativ kilde. Kontroller alltid mot Lovdata ved
          juridisk bruk.
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
          <Link
            href="/kilde-og-lisens"
            className="underline hover:text-stone-900"
          >
            Kilde og lisens
          </Link>
          <Link href="/om" className="underline hover:text-stone-900">
            Om Lovspeil
          </Link>
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-6">
          <a
            href="https://www.devify.no"
            className="inline-flex items-center gap-2 text-stone-500 transition-colors hover:text-stone-800"
            rel="noopener noreferrer"
            target="_blank"
          >
            <img
              src="/devify/logo.svg"
              alt=""
              width={20}
              height={23}
              className="h-5 w-auto"
            />
            <span>Levert av Dev AS</span>
          </a>
          <a
            href="https://github.com/devify-no/lovspeil.no"
            className="text-stone-500 transition-colors hover:text-stone-800"
            rel="noopener noreferrer"
            target="_blank"
            aria-label="Kildekode på GitHub"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-5 w-5 fill-current"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-3.795-.735-.525-1.335-1.275-1.695-1.275-1.695-1.05-.72.075-.705.075-.705 1.155.075 1.765 1.185 1.765 1.185 1.035 1.755 2.7 1.245 3.355.96.105-.75.405-1.245.735-1.53-2.385-.27-4.875-1.185-4.875-5.265 0-1.17.42-2.115 1.11-2.865-.12-.27-.495-1.32.105-2.745 0 0 .915-.3 3.015 1.095.87-.24 1.815-.36 2.745-.36.945 0 1.89.12 2.76.36 2.1-1.41 3.015-1.095 3.015-1.095.6 1.425.225 2.475.105 2.745.69.75 1.11 1.695 1.11 2.865 0 4.095-2.505 4.995-4.905 5.25.39.33.735.96.735 1.945 0 1.41-.015 2.545-.015 2.895 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
