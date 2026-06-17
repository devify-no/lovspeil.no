import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { normalizeAlias } from "./slug";
import type { DocumentAlias } from "@/types/legal";

export interface ManualAliasEntry {
  slug: string;
  aliases: string[];
}

export function loadManualAliases(
  dataDir: string = join(process.cwd(), "data")
): ManualAliasEntry[] {
  const path = join(dataDir, "manual-aliases.json");
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw) as ManualAliasEntry[];
}

function addAlias(
  documentId: string,
  alias: string,
  source: DocumentAlias["source"],
  aliases: DocumentAlias[],
  seen: Set<string>
) {
  const normalized = normalizeAlias(alias);
  if (!normalized || normalized.length < 3) return;
  const key = `${documentId}:${normalized}`;
  if (seen.has(key)) return;
  seen.add(key);
  aliases.push({ documentId, alias, normalizedAlias: normalized, source });
}

export function buildAliasIndex(
  documents: Array<{
    id: string;
    slug: string;
    title: string;
    shortTitle: string | null;
    abbreviation: string | null;
    legalCitationForms: string[];
  }>,
  manualAliases: ManualAliasEntry[] = loadManualAliases()
): DocumentAlias[] {
  const aliases: DocumentAlias[] = [];
  const seen = new Set<string>();

  for (const doc of documents) {
    addAlias(doc.id, doc.title, "title", aliases, seen);
    if (doc.shortTitle) addAlias(doc.id, doc.shortTitle, "shortTitle", aliases, seen);
    if (doc.abbreviation) addAlias(doc.id, doc.abbreviation, "abbreviation", aliases, seen);

    for (const form of doc.legalCitationForms) {
      addAlias(doc.id, form, "inferred", aliases, seen);
    }
  }

  const slugToId = new Map(documents.map((d) => [d.slug, d.id]));
  for (const manual of manualAliases) {
    const docId = slugToId.get(manual.slug);
    if (!docId) continue;
    for (const alias of manual.aliases) {
      addAlias(docId, alias, "manual", aliases, seen);
    }
  }

  return aliases;
}
