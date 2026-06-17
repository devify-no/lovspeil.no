#!/usr/bin/env tsx
/**
 * Import Lovdata HTML/XML files from /data/nl and /data/sf into PostgreSQL.
 */
import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { db, schema } from "../db";
import { parseLovdataHtml, flattenNodes } from "../lib/lovdata/parser";
import { eq } from "drizzle-orm";

const DATA_DIR = join(process.cwd(), "data");

async function importSourceType(sourceType: "nl" | "sf") {
  const dir = join(DATA_DIR, sourceType);
  if (!existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    return;
  }

  const files = readdirSync(dir).filter((f) => f.endsWith(".xml"));
  console.log(`Importing ${files.length} files from ${sourceType}/...`);

  const existingDocs = await db.select({ slug: schema.legalDocuments.slug }).from(schema.legalDocuments);
  const existingSlugs = new Set(existingDocs.map((d) => d.slug));

  let imported = 0;
  let errors = 0;

  for (const file of files) {
    const filePath = join(dir, file);
    try {
      const html = readFileSync(filePath, "utf8");
      const parsed = parseLovdataHtml(html, {
        filePath: `data/${sourceType}/${file}`,
        sourceType,
        existingSlugs,
      });

      existingSlugs.add(parsed.meta.slug);

      // Upsert document
      const [doc] = await db
        .insert(schema.legalDocuments)
        .values({
          sourceType: parsed.meta.sourceType,
          documentKey: parsed.meta.documentKey,
          lovdataId: parsed.meta.lovdataId,
          title: parsed.meta.title,
          shortTitle: parsed.meta.shortTitle,
          abbreviation: parsed.meta.abbreviation,
          slug: parsed.meta.slug,
          type: parsed.meta.type,
          date: parsed.meta.date,
          number: parsed.meta.number,
          ministry: parsed.meta.ministry,
          status: parsed.meta.status,
          rawXmlPath: parsed.meta.rawXmlPath,
          sourceUpdatedAt: parsed.meta.sourceUpdatedAt,
          canonicalLovdataUrl: parsed.meta.canonicalLovdataUrl,
          legalCitationForms: parsed.meta.legalCitationForms,
          legalAreas: parsed.meta.legalAreas,
          language: parsed.meta.language,
          importedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.legalDocuments.documentKey,
          set: {
            title: parsed.meta.title,
            shortTitle: parsed.meta.shortTitle,
            slug: parsed.meta.slug,
            ministry: parsed.meta.ministry,
            status: parsed.meta.status,
            sourceUpdatedAt: parsed.meta.sourceUpdatedAt,
            legalCitationForms: parsed.meta.legalCitationForms,
            importedAt: new Date(),
          },
        })
        .returning();

      // Delete existing nodes for re-import
      await db
        .delete(schema.legalNodes)
        .where(eq(schema.legalNodes.documentId, doc.id));

      // Insert nodes recursively
      async function insertNodes(
        nodes: typeof parsed.nodes,
        parentId: string | null = null
      ) {
        for (const node of nodes) {
          const [inserted] = await db
            .insert(schema.legalNodes)
            .values({
              documentId: doc.id,
              parentId,
              nodeType: node.nodeType,
              number: node.number,
              title: node.title,
              plainText: node.plainText,
              html: node.html,
              order: node.order,
              anchor: node.anchor,
              slugPath: node.slugPath,
              normalizedSectionNumber: node.normalizedSectionNumber,
              lovdataUrl: node.lovdataUrl,
            })
            .returning();

          if (node.children.length > 0) {
            await insertNodes(node.children, inserted.id);
          }
        }
      }

      await insertNodes(parsed.nodes);
      imported++;

      if (imported % 50 === 0) {
        console.log(`  Progress: ${imported}/${files.length}`);
      }
    } catch (err) {
      errors++;
      console.error(`  Error importing ${file}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`Done: ${imported} imported, ${errors} errors`);
}

async function main() {
  const arg = process.argv[2];
  if (arg === "nl" || arg === "sf") {
    await importSourceType(arg);
  } else {
    await importSourceType("nl");
    await importSourceType("sf");
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
