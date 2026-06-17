import {
  buildDocumentUrl,
  extractShortTitle,
  normalizeAlias,
  normalizeSectionNumber,
} from "./slug";
import type { DocumentLinkIndex, DocumentLinkTarget } from "./link-resolver-types";

interface TextMatch {
  start: number;
  end: number;
  text: string;
  url: string;
}

function lookupDocument(
  aliasText: string,
  index: DocumentLinkIndex
): (DocumentLinkTarget & { documentKey: string }) | null {
  const normalized = normalizeAlias(aliasText);
  const documentKey = index.aliasesByNormalized.get(normalized);
  if (!documentKey) return null;

  const doc = index.byKey.get(documentKey);
  if (!doc) return null;

  return { ...doc, documentKey };
}

function sectionUrl(
  doc: DocumentLinkTarget & { documentKey: string },
  sectionRaw: string,
  index: DocumentLinkIndex
): string {
  const normalized = normalizeSectionNumber(`§${sectionRaw.replace(/\s+/g, "-")}`);
  if (normalized) {
    const sectionMap = index.sectionsByKey.get(doc.documentKey);
    const slugPath = sectionMap?.get(normalized);
    if (slugPath) {
      return buildDocumentUrl(doc.type, doc.slug, slugPath);
    }
  }
  return buildDocumentUrl(doc.type, doc.slug);
}

function chapterUrl(
  doc: DocumentLinkTarget & { documentKey: string },
  chapterNum: string,
  index: DocumentLinkIndex
): string {
  const chapterMap = index.chaptersByKey.get(doc.documentKey);
  const anchor = chapterMap?.get(chapterNum.toLowerCase());
  const base = buildDocumentUrl(doc.type, doc.slug);
  return anchor ? `${base}#${anchor}` : base;
}

function collectPlainTextMatches(
  text: string,
  index: DocumentLinkIndex
): TextMatch[] {
  const matches: TextMatch[] = [];

  const patterns: Array<{
    re: RegExp;
    build: (match: RegExpExecArray) => TextMatch | null;
  }> = [
    {
      re: /§§?\s*(\d+(?:-\d+)?(?:\s*[a-z])?)\s+til\s+(\d+(?:-\d+)?(?:\s*[a-z])?)\s+i\s+(lov om [a-zæøå0-9\s-]+?)(?=[\s,.;)]|$)/gi,
      build: (m) => {
        const doc = lookupDocument(m[3], index);
        if (!doc) return null;
        return {
          start: m.index,
          end: m.index + m[0].length,
          text: m[0],
          url: sectionUrl(doc, m[1], index),
        };
      },
    },
    {
      re: /kapittel\s+(\d+[a-z]?)\s+i\s+(lov om [a-zæøå0-9\s-]+?)(?=[\s,.;)]|$)/gi,
      build: (m) => {
        const doc = lookupDocument(m[2], index);
        if (!doc) return null;
        return {
          start: m.index,
          end: m.index + m[0].length,
          text: m[0],
          url: chapterUrl(doc, m[1], index),
        };
      },
    },
    {
      re: /(?:^|[\s(,])(lov om [a-zæøå0-9\s-]+?)(?=[\s,.;)]|$)/gi,
      build: (m) => {
        const doc = lookupDocument(m[1], index);
        if (!doc) return null;
        return {
          start: m.index + m[0].indexOf(m[1]),
          end: m.index + m[0].indexOf(m[1]) + m[1].length,
          text: m[1],
          url: buildDocumentUrl(doc.type, doc.slug),
        };
      },
    },
    {
      re: /(?:^|[\s(,])([a-zæøå]+loven)(?=[\s,.;)]|$)/gi,
      build: (m) => {
        const doc = lookupDocument(m[1], index);
        if (!doc) return null;
        return {
          start: m.index + m[0].indexOf(m[1]),
          end: m.index + m[0].indexOf(m[1]) + m[1].length,
          text: m[1],
          url: buildDocumentUrl(doc.type, doc.slug),
        };
      },
    },
  ];

  for (const { re, build } of patterns) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const built = build(match);
      if (built) matches.push(built);
    }
  }

  matches.sort((a, b) => b.text.length - a.text.length || a.start - b.start);

  const used: TextMatch[] = [];
  for (const candidate of matches) {
    if (used.some((u) => rangesOverlap(u, candidate))) continue;
    used.push(candidate);
  }

  return used.sort((a, b) => a.start - b.start);
}

function rangesOverlap(a: TextMatch, b: TextMatch): boolean {
  return a.start < b.end && b.start < a.end;
}

function linkifyPlainTextSegment(text: string, index: DocumentLinkIndex): string {
  const matches = collectPlainTextMatches(text, index);
  if (matches.length === 0) return text;

  let result = "";
  let cursor = 0;

  for (const match of matches) {
    result += text.slice(cursor, match.start);
    result += `<a href="${match.url}" class="legal-link legal-link--internal">${match.text}</a>`;
    cursor = match.end;
  }

  return result + text.slice(cursor);
}

/**
 * Expand Lovdata-style partial links where only the law name is inside the anchor.
 */
export function expandAdjacentReferenceLinks(html: string): string {
  return html.replace(
    new RegExp(
      `((?:§§?\\s*\\d+(?:-\\d+)?(?:\\s*[a-z])?\\s+til\\s+\\d+(?:-\\d+)?(?:\\s*[a-z])?\\s+i\\s+|kapittel\\s+\\d+[a-z]?\\s+i\\s+))(<a\\s+[^>]*href="([^"]+)"[^>]*class="legal-link[^"]*"[^>]*>)([^<]*)(<\\/a>)`,
      "gi"
    ),
    (full, prefix: string, _open: string, href: string, linkText: string) => {
      if (!href.startsWith("/")) return full;
      return `<a href="${href}" class="legal-link legal-link--internal">${prefix}${linkText}</a>`;
    }
  );
}

export function linkifyPlainTextInHtml(
  html: string,
  index: DocumentLinkIndex
): string {
  const parts = html.split(/(<[^>]+>)/g);
  let anchorDepth = 0;

  return parts
    .map((part) => {
      if (part.startsWith("<")) {
        if (/^<a[\s>]/i.test(part)) anchorDepth++;
        else if (/^<\/a>/i.test(part)) anchorDepth = Math.max(0, anchorDepth - 1);
        return part;
      }
      if (anchorDepth > 0) return part;
      return linkifyPlainTextSegment(part, index);
    })
    .join("");
}

export function buildAliasMapForDocuments(
  documents: Array<{ documentKey: string; title: string }>,
  extraAliases: Array<{ documentKey: string; normalizedAlias: string }> = []
): Map<string, string> {
  const map = new Map<string, string>();

  function add(documentKey: string, alias: string) {
    const normalized = normalizeAlias(alias);
    if (!normalized || normalized.length < 3) return;
    if (!map.has(normalized)) {
      map.set(normalized, documentKey);
    }
  }

  for (const doc of documents) {
    const { mainTitle, shortTitle } = extractShortTitle(doc.title);
    add(doc.documentKey, mainTitle);
    if (shortTitle) add(doc.documentKey, shortTitle);

    const lovOm = mainTitle.match(/^lov om\s+(.+)$/i);
    if (lovOm) add(doc.documentKey, `lov om ${lovOm[1]}`);
  }

  for (const alias of extraAliases) {
    add(alias.documentKey, alias.normalizedAlias);
  }

  return map;
}
