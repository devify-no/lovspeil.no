# Lovspeil

Gratis, uoffisiell og leservennlig plattform for norske lover og sentrale forskrifter.

Inspirert av [lagen.nu](https://lagen.nu) i Sverige. Data hentes fra [Lovdata](https://lovdata.no) under [NLOD 2.0](https://data.norge.no/nlod/en/2.0/).

**Lovspeil er ikke offisiell.** Lovdata er autoritativ kilde. Kontroller alltid mot Lovdata ved juridisk bruk.

Kildekode: [github.com/devify-no/lovspeil.no](https://github.com/devify-no/lovspeil.no)

## Tech stack

- **Next.js 15** (App Router, SSR/SSG)
- **TypeScript** (strict)
- **Tailwind CSS**
- **PostgreSQL** + **Drizzle ORM**
- **Cheerio** for HTML/XML parsing
- **Vitest** for tester

## Kom i gang

### Forutsetninger

- Node.js 20+
- PostgreSQL 15+

### Installasjon

```bash
git clone https://github.com/devify-no/lovspeil.no.git
cd lovspeil.no
npm install
cp .env.example .env
# Rediger DATABASE_URL i .env
```

### Database

**Local development (Docker):**

```bash
npm run db:setup    # start Postgres + push schema
# eller step-by-step:
npm run db:up       # docker compose up -d
npm run db:push     # apply schema
```

Connection string: `postgres://lovspeil:lovspeil@localhost:5432/lovspeil`

**Neon Postgres (production):**

1. Create a project at [console.neon.tech](https://console.neon.tech)
2. Copy the connection string into `.env` as `DATABASE_URL`
3. For serverless hosting (e.g. Vercel), use the **pooled** connection string from the Neon dashboard
4. Push the schema:

```bash
npm run db:push
# or generate and run migrations:
npm run db:generate
npm run db:migrate
```

The app connects to Neon via `postgres.js` with SSL. Use the **pooled** connection string from the Neon dashboard for serverless hosting; for long imports (`npm run import:xml`), the direct (non-pooler) URL is often faster.

**Static generation (SSG):** Law and regulation pages (~4 000) are pre-rendered at build time. Section pages use on-demand ISR (cached after first visit). Set `DATABASE_URL` in your hosting provider's **build** environment so `next build` can fetch slugs.

**Uten Docker (lokal Postgres):**

```bash
createdb lovspeil
npm run db:push
```

### Importer data

XML/HTML-filer fra Lovdata ligger i `/data/nl` (lover) og `/data/sf` (forskrifter).

```bash
# Importer alle lover og forskrifter
npm run import:xml

# Eller kun lover / forskrifter
npm run import:xml nl
npm run import:xml sf
```

### Bygg referanseindeks

Etter import, bygg kryssreferanse-indeks:

```bash
npm run build:references
```

### Kjør utviklingsserver

```bash
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Beskrivelse |
|--------|-------------|
| `npm run dev` | Start utviklingsserver |
| `npm run build` | Bygg for produksjon |
| `npm run import:xml` | Importer XML/HTML fra `/data` |
| `npm run build:references` | Bygg kryssreferanse-indeks |
| `npm run sync:lovdata` | (Fremtidig) Synkroniser fra Lovdata API |
| `npm run migrate:long-slugs` | Kort ned slug-er over 200 tegn (nødvendig for SSG) |
| `npm run db:up` | Start PostgreSQL via Docker |
| `npm run db:down` | Stop PostgreSQL container |
| `npm run db:reset` | Wipe and restart database |
| `npm run db:setup` | Start DB + push schema |
| `npm run db:push` | Push database-schema |
| `npm run test` | Kjør tester |

## URL-struktur

| URL | Beskrivelse |
|-----|-------------|
| `/lover` | Oversikt over lover |
| `/lover/aksjeloven` | Aksjeloven |
| `/lover/aksjeloven/3-1` | Aksjeloven § 3-1 |
| `/forskrifter` | Oversikt over forskrifter |
| `/sok?q=...` | Søk |
| `/om` | Om Lovspeil |
| `/kilde-og-lisens` | Kilde og lisens |

## Dataformat

Filene i `/data/nl` og `/data/sf` er HTML eksportert fra Lovdata (despite `.xml` extension). Strukturen er:

- `<header class="documentHeader">` – metadata (departement, dato, rettsområde)
- `<section class="section">` – kapitler
- `<article class="legalArticle" data-name="§1-1">` – paragrafer
- `<a href="lov/1997-06-13-44">` – eksplisitte kryssreferanser

## Referanseløser

Referanseløseren jobber i tre steg:

1. **Bevar XML-lenker** – Eksplisitte `<a href="lov/...">` fra Lovdata
2. **Samme-dokument** – `§ 7`, `§§ 7 og 9`, `§ 3-1`
3. **Eksterne lover** – `aksjeloven § 3-1`, `forvaltningsloven § 11`

Alias-indeks bygges fra titler, korte navn og `/data/manual-aliases.json`.

Konservativ linking: kun auto-lenke ved confidence ≥ 0.75.

## SEO

- Statically generated listing pages and document pages (~4 000); section pages via on-demand ISR
- Split `sitemap.xml` index covering all documents and ~86 000 section URLs (Google 50k limit)
- `robots.txt`
- Canonical URLs og Open Graph metadata
- JSON-LD (WebPage, BreadcrumbList, Legislation)

## Tester

```bash
npm test
```

Tester dekker slug-generering, seksjonsnormalisering, referanseløsning og XML-parsing av eksempelfiler.

## Lisens

Applikasjonskoden er open source. Lovdata-innhold tilgjengeliggjøres under NLOD 2.0 med attribution til Lovdata.
