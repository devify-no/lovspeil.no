export function SourceDisclaimer() {
  return (
    <aside
      className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
      aria-label="Kilde og ansvarsfraskrivelse"
    >
      <p className="font-medium">
        Lovspeil er en uoffisiell visning av norske lover og forskrifter. Lovdata
        er autoritativ kilde. Kontroller alltid mot Lovdata ved juridisk bruk.
      </p>
      <p className="mt-2 text-amber-900">
        Data hentet fra Lovdata. Tilgjengeliggjort under Norsk lisens for
        offentlige data (NLOD) 2.0.
      </p>
    </aside>
  );
}
