/**
 * Normalize Norwegian text for alias matching.
 * Strips diacritics inconsistently handled in legal citations.
 */
export function normalizeAlias(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[æ]/g, "ae")
    .replace(/[ø]/g, "o")
    .replace(/[å]/g, "a")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Create a URL-safe slug from text.
 */
export function slugify(text: string): string {
  return normalizeAlias(text)
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Remove HTML markup accidentally stored as plain text in Lovdata titles.
 */
export function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]+>/g, "");
}

export function cleanDocumentTitle(title: string): string {
  return stripHtmlTags(title).replace(/\s+/g, " ").trim();
}

/**
 * Extract short title from Lovdata title patterns:
 * - "Lov om aksjeselskaper (aksjeloven)"
 * - "Lov om petroleumsvirksomhet [petroleumsloven]"
 * - "Forskrift til ... (forskriftsnavnet)"
 */
export function extractShortTitle(title: string): {
  mainTitle: string;
  shortTitle: string | null;
  abbreviation: string | null;
} {
  const cleaned = cleanDocumentTitle(title);
  const parenMatch = cleaned.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (parenMatch) {
    return {
      mainTitle: parenMatch[1].trim(),
      shortTitle: parenMatch[2].trim(),
      abbreviation: null,
    };
  }

  const bracketMatch = cleaned.match(/^(.+?)\s*\[([^\]]+)\]\s*$/);
  if (bracketMatch) {
    return {
      mainTitle: bracketMatch[1].trim(),
      shortTitle: bracketMatch[2].trim(),
      abbreviation: null,
    };
  }

  return { mainTitle: cleaned.trim(), shortTitle: null, abbreviation: null };
}

function isLatinSpeciesName(text: string): boolean {
  return /^[A-Z][a-z]+(?: [a-z]+)+$/.test(text.trim());
}

/**
 * Generate a human-friendly, stable slug for a legal document.
 * Prefers shortTitle (e.g. "aksjeloven"), falls back to normalized main title.
 */
export function generateDocumentSlug(
  title: string,
  documentKey: string,
  existingSlugs: Set<string>
): string {
  const { mainTitle, shortTitle } = extractShortTitle(title);
  const canonicalKey = canonicalDocumentKey(documentKey);

  const candidates: string[] = [];
  const speciesInParens = shortTitle && isLatinSpeciesName(shortTitle);
  const isForskriftOm = /^forskrift om\s+/i.test(mainTitle);

  if (shortTitle && !(speciesInParens && !isForskriftOm)) {
    candidates.push(slugify(shortTitle));
  }

  candidates.push(slugify(mainTitle));

  const withoutPrefix = mainTitle
    .replace(/^lov om\s+/i, "")
    .replace(/^forskrift til\s+/i, "")
    .replace(/^forskrift om\s+/i, "");
  if (withoutPrefix !== mainTitle) {
    candidates.push(slugify(withoutPrefix));
  }

  if (speciesInParens && !isForskriftOm && shortTitle) {
    candidates.push(slugify(shortTitle));
  }

  const keySuffix = canonicalKey.replace(/^lov\//, "").replace(/^forskrift\//, "");

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (!existingSlugs.has(candidate)) {
      return finalizeDocumentSlug(candidate);
    }
    const withKey = `${candidate}-${keySuffix}`;
    if (!existingSlugs.has(withKey)) {
      return finalizeDocumentSlug(withKey);
    }
  }

  const base = candidates.find(Boolean) ?? "dokument";
  return finalizeDocumentSlug(`${base}-${keySuffix}`);
}

/** Slugs must never contain path separators. */
export function finalizeDocumentSlug(slug: string): string {
  return slug
    .replace(/\//g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Parse a Lovdata date field safely. The `lastupdated` field is often free text,
 * not a single ISO date – return null rather than an invalid Date.
 */
export function parseLovdataDate(text: string | null | undefined): Date | null {
  if (!text?.trim()) return null;

  const trimmed = text.trim();

  // Direct ISO date
  const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    const d = new Date(isoMatch[1]);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // Norwegian dd.mm.yyyy anywhere in the string
  const noMatch = trimmed.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (noMatch) {
    const d = new Date(`${noMatch[3]}-${noMatch[2]}-${noMatch[1]}`);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // ISO date in parentheses, e.g. "§ 12 nr. 4 (2008-01-21)"
  const parenMatch = trimmed.match(/\((\d{4}-\d{2}-\d{2})\)/);
  if (parenMatch) {
    const d = new Date(parenMatch[1]);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // Leading ISO before parenthetical note, e.g. "2002-12-16 (§ 10)"
  const leadingIso = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s*\(/);
  if (leadingIso) {
    const d = new Date(leadingIso[1]);
    if (!Number.isNaN(d.getTime())) return d;
  }

  return null;
}

/**
 * Normalize section number from data-name attribute.
 * "§1-1" -> "1-1", "§11" -> "11", "§1-5 a" -> "1-5-a"
 */
export function normalizeSectionNumber(dataName: string | null): string | null {
  if (!dataName) return null;

  // Chapter markers from Lovdata data-name, not § references
  if (/^kap/i.test(dataName) || /^KAPITTEL/i.test(dataName)) return null;

  const cleaned = dataName
    .replace(/^§\s*/i, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/gi, (c) => (c === " " ? "-" : c))
    .toLowerCase()
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || null;
}

/**
 * Convert normalized section number to URL slug path segment.
 */
export function sectionToSlugPath(sectionNumber: string): string {
  return sectionNumber.toLowerCase();
}

/**
 * Canonical Lovdata document key used in hrefs: lov/… or forskrift/…
 * Strips NL/ or SF/ prefix from stored dokid values.
 */
export function canonicalDocumentKey(documentKey: string): string {
  return documentKey.replace(/^(?:nl|sf)\//i, "");
}

/**
 * Parse document key from filename: nl-19970613-044.xml -> lov/1997-06-13-44
 */
export function parseDocumentKeyFromFilename(
  filename: string,
  sourceType: "nl" | "sf"
): string {
  const base = filename.replace(/\.xml$/i, "");
  const match = base.match(/^(nl|sf)-(\d{4})(\d{2})(\d{2})-(\d+)/);
  if (match) {
    const [, , year, month, day, num] = match;
    const prefix = sourceType === "nl" ? "lov" : "forskrift";
    return `${prefix}/${year}-${month}-${day}-${num}`;
  }
  return base;
}

/**
 * Parse Lovdata legacy ID from metadata: LOV-1997-06-13-44
 */
export function parseLovdataId(legacyId: string): {
  type: "lov" | "forskrift";
  date: string;
  number: string;
} | null {
  const match = legacyId.match(/^(LOV|FOR)-(\d{4})-(\d{2})-(\d{2})-(\d+)/i);
  if (!match) return null;
  const [, kind, year, month, day, num] = match;
  return {
    type: kind.toLowerCase() === "lov" ? "lov" : "forskrift",
    date: `${year}-${month}-${day}`,
    number: num,
  };
}

/**
 * Build canonical Lovdata URL from document key.
 */
export function buildLovdataUrl(documentKey: string): string {
  return `https://lovdata.no/${documentKey}`;
}

/**
 * Build internal URL path for a document or section.
 */
export function buildDocumentUrl(
  type: "law" | "regulation",
  slug: string,
  section?: string | null
): string {
  const base = type === "law" ? "/lover" : "/forskrifter";
  if (section) {
    return `${base}/${slug}/${sectionToSlugPath(section)}`;
  }
  return `${base}/${slug}`;
}

/**
 * Infer citation forms from document metadata.
 */
export function inferCitationForms(
  title: string,
  shortTitle: string | null,
  abbreviation: string | null
): string[] {
  const forms = new Set<string>();
  const { mainTitle } = extractShortTitle(title);

  forms.add(mainTitle);
  if (shortTitle) forms.add(shortTitle);
  if (abbreviation) forms.add(abbreviation);

  // "lov om X" -> "X"
  const lovOmMatch = mainTitle.match(/^lov om\s+(.+)$/i);
  if (lovOmMatch) {
    forms.add(lovOmMatch[1].trim());
  }

  // Common -loven suffix from subject noun
  if (shortTitle?.endsWith("loven")) {
    forms.add(shortTitle);
  }

  return [...forms].filter(Boolean);
}
