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
  const parenMatch = title.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (parenMatch) {
    return {
      mainTitle: parenMatch[1].trim(),
      shortTitle: parenMatch[2].trim(),
      abbreviation: null,
    };
  }

  const bracketMatch = title.match(/^(.+?)\s*\[([^\]]+)\]\s*$/);
  if (bracketMatch) {
    return {
      mainTitle: bracketMatch[1].trim(),
      shortTitle: bracketMatch[2].trim(),
      abbreviation: null,
    };
  }

  return { mainTitle: title.trim(), shortTitle: null, abbreviation: null };
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

  const candidates: string[] = [];
  if (shortTitle) {
    candidates.push(slugify(shortTitle));
  }
  candidates.push(slugify(mainTitle));

  // Remove generic prefixes for fallback
  const withoutPrefix = mainTitle
    .replace(/^lov om\s+/i, "")
    .replace(/^forskrift til\s+/i, "")
    .replace(/^forskrift om\s+/i, "");
  if (withoutPrefix !== mainTitle) {
    candidates.push(slugify(withoutPrefix));
  }

  const keySuffix = documentKey.replace(/^lov\//, "").replace(/^forskrift\//, "");

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (!existingSlugs.has(candidate)) {
      return candidate;
    }
    // Try appending key suffix before falling back to next candidate
    const withKey = `${candidate}-${keySuffix}`;
    if (!existingSlugs.has(withKey)) {
      return withKey;
    }
  }

  const base = candidates.find(Boolean) ?? "dokument";
  return `${base}-${documentKey.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`;
}

/**
 * Normalize section number from data-name attribute.
 * "§1-1" -> "1-1", "§11" -> "11", "§1-5 a" -> "1-5-a"
 */
export function normalizeSectionNumber(dataName: string | null): string | null {
  if (!dataName) return null;

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
 * Parse document key from filename: nl-19970613-044.xml -> nl/1997-06-13-44
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
