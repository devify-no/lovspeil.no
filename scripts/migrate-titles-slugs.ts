#!/usr/bin/env tsx
import { db, schema } from "../db";
import { eq, sql } from "drizzle-orm";
import {
  canonicalDocumentKey,
  cleanDocumentTitle,
  extractShortTitle,
  generateDocumentSlug,
} from "../lib/lovdata/slug";

async function migrateHtmlTitlesAndSlugs() {
  const affected = await db
    .select()
    .from(schema.legalDocuments)
    .where(sql`${schema.legalDocuments.title} LIKE '%<%'`);

  if (affected.length === 0) {
    console.log("No documents with HTML in titles.");
    return;
  }

  console.log(`Fixing ${affected.length} documents with HTML in titles...`);

  const reservedSlugs = new Set(
    (
      await db
        .select({ slug: schema.legalDocuments.slug })
        .from(schema.legalDocuments)
    )
      .map((d) => d.slug)
      .filter((slug) => !slug.includes("/"))
  );

  for (const doc of affected) {
    reservedSlugs.delete(doc.slug);
    const title = cleanDocumentTitle(doc.title);
    const { shortTitle } = extractShortTitle(title);
    const slug = generateDocumentSlug(
      title,
      canonicalDocumentKey(doc.documentKey),
      reservedSlugs
    );
    reservedSlugs.add(slug);

    await db
      .update(schema.legalDocuments)
      .set({
        title,
        shortTitle: shortTitle ?? doc.shortTitle,
        slug,
      })
      .where(eq(schema.legalDocuments.id, doc.id));

    console.log(`  ${doc.slug} -> ${slug}`);
  }
}

migrateHtmlTitlesAndSlugs()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
