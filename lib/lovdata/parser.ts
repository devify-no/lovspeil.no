import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type {
  ParsedDocument,
  ParsedLegalNode,
  ExplicitLink,
  LegalDocumentMeta,
  LegalNodeType,
} from "@/types/legal";
import {
  extractShortTitle,
  generateDocumentSlug,
  normalizeSectionNumber,
  parseDocumentKeyFromFilename,
  parseLovdataId,
  buildLovdataUrl,
  inferCitationForms,
} from "./slug";

const NODE_CLASS_MAP: Record<string, LegalNodeType> = {
  section: "chapter",
  legalArticle: "section",
  numberedLegalP: "paragraph",
  legalP: "paragraph",
  listArticle: "letter",
  defaultList: "text",
};

function getTextContent(el: cheerio.Cheerio<Element>): string {
  return el.text().replace(/\s+/g, " ").trim();
}

function getInnerHtml(el: cheerio.Cheerio<Element>): string {
  return el.html()?.trim() ?? "";
}

function extractMetadata($: cheerio.CheerioAPI): Partial<LegalDocumentMeta> {
  const header = $("header.documentHeader");
  const getField = (className: string): string | null => {
    const dt = header.find(`dt.${className}`);
    if (!dt.length) return null;
    const dd = dt.next("dd");
    return getTextContent(dd) || null;
  };

  const legacyId = getField("legacyID") ?? "";
  const dokid = getField("dokid") ?? "";
  const parsed = parseLovdataId(legacyId);

  const legalAreas: string[] = [];
  header.find("dd.legalArea a").each((_, el) => {
    const text = $(el).text().trim();
    if (text) legalAreas.push(text);
  });

  const lastUpdated = header.find("dd.lastupdated").text().trim();

  return {
    lovdataId: legacyId,
    documentKey: dokid.replace(/^NL\//, "").toLowerCase() || legacyId.toLowerCase(),
    title: $("head title").text().trim(),
    ministry: getField("ministry"),
    status: getField("dateInForce"),
    date: parsed?.date ?? null,
    number: parsed?.number ?? null,
    legalAreas,
    sourceUpdatedAt: lastUpdated ? new Date(lastUpdated) : null,
    language: $("html").attr("lang") ?? "nb",
  };
}

function classifyNode(el: Element): LegalNodeType {
  const cls = el.attribs?.class ?? "";
  for (const [className, nodeType] of Object.entries(NODE_CLASS_MAP)) {
    if (cls.includes(className)) return nodeType;
  }
  if (el.tagName === "section") return "chapter";
  if (el.tagName === "article") return "text";
  return "text";
}

function extractSectionInfo(
  $: cheerio.CheerioAPI,
  el: Element
): { number: string | null; title: string | null; normalizedSectionNumber: string | null } {
  const dataName = el.attribs?.["data-name"] ?? null;
  const header = $(el).find(".legalArticleHeader").first();
  if (header.length) {
    const value = header.find(".legalArticleValue").text().trim();
    const titlePart = header.find(".legalArticleTitle").text().trim();
    const number = value || dataName;
    return {
      number,
      title: titlePart || null,
      normalizedSectionNumber: normalizeSectionNumber(dataName ?? number),
    };
  }

  const heading = $(el).children("h2, h3, h4").first();
  if (heading.length) {
    const text = getTextContent(heading);
    const sectionMatch = text.match(/^(§\s*[\d\-a-zæøå\s]+)\.?\s*(.*)$/i);
    if (sectionMatch) {
      return {
        number: sectionMatch[1].trim(),
        title: sectionMatch[2]?.trim() || null,
        normalizedSectionNumber: normalizeSectionNumber(sectionMatch[1]),
      };
    }
    const chapterMatch = text.match(/^kapittel\s+(\d+[a-z]?)\.?\s*(.*)$/i);
    if (chapterMatch) {
      return {
        number: chapterMatch[1],
        title: chapterMatch[2]?.trim() || text,
        normalizedSectionNumber: null,
      };
    }
    return { number: null, title: text, normalizedSectionNumber: null };
  }

  return {
    number: dataName,
    title: null,
    normalizedSectionNumber: normalizeSectionNumber(dataName),
  };
}

function shouldTraverseChildren(el: Element, nodeType: LegalNodeType): boolean {
  if (nodeType === "section") return false;
  if (nodeType === "paragraph") return false;
  if (el.attribs?.class?.includes("legalArticle")) return false;
  return true;
}

function parseNodeTree(
  $: cheerio.CheerioAPI,
  el: Element,
  orderCounter: { value: number }
): ParsedLegalNode | null {
  const nodeType = classifyNode(el);
  const anchor = el.attribs?.id ?? `node-${orderCounter.value}`;
  const lovdataUrl = el.attribs?.["data-lovdata-URL"] ?? null;
  const { number, title, normalizedSectionNumber } = extractSectionInfo($, el);

  const children: ParsedLegalNode[] = [];

  if (shouldTraverseChildren(el, nodeType)) {
    $(el)
      .children("section, article")
      .each((_, child) => {
        const childNode = parseNodeTree($, child, orderCounter);
        if (childNode) children.push(childNode);
      });
  }

  const plainText = getTextContent($(el));
  const html = getInnerHtml($(el));

  if (!plainText && children.length === 0) return null;

  const order = orderCounter.value++;

  return {
    nodeType,
    number,
    title,
    plainText,
    html,
    order,
    anchor,
    slugPath: normalizedSectionNumber,
    normalizedSectionNumber,
    lovdataUrl,
    children,
  };
}

function extractExplicitLinks(
  $: cheerio.CheerioAPI,
  containerSelector: string
): ExplicitLink[] {
  const links: ExplicitLink[] = [];
  $(containerSelector)
    .find("a[href]")
    .each((_, el) => {
      const href = el.attribs.href;
      const text = $(el).text().trim();
      if (!href || href.startsWith("#") || href.startsWith("legal-areas")) return;

      let fromAnchor = "document";
      let parent = el.parent as Element | null;
      while (parent) {
        if ("attribs" in parent && parent.attribs?.id) {
          fromAnchor = parent.attribs.id;
          break;
        }
        parent = parent.parent as Element | null;
      }

      links.push({
        href,
        text,
        fromAnchor,
        lovdataPath: href.startsWith("lov/") || href.startsWith("forskrift/")
          ? href
          : null,
      });
    });
  return links;
}

export interface ParseOptions {
  filePath: string;
  sourceType: "nl" | "sf";
  existingSlugs?: Set<string>;
}

export function parseLovdataHtml(
  htmlContent: string,
  options: ParseOptions
): ParsedDocument {
  const $ = cheerio.load(htmlContent);
  const metaPartial = extractMetadata($);
  const title = metaPartial.title ?? "Ukjent dokument";
  const { mainTitle, shortTitle, abbreviation } = extractShortTitle(title);

  const filename = options.filePath.split("/").pop() ?? "";
  const documentKey =
    metaPartial.documentKey ??
    parseDocumentKeyFromFilename(filename, options.sourceType);

  const existingSlugs = options.existingSlugs ?? new Set<string>();
  const slug = generateDocumentSlug(title, documentKey, existingSlugs);

  const type = options.sourceType === "nl" ? "law" : "regulation";
  const citationForms = inferCitationForms(title, shortTitle, abbreviation);

  const meta: LegalDocumentMeta = {
    sourceType: options.sourceType,
    documentKey,
    lovdataId: metaPartial.lovdataId ?? documentKey,
    title,
    shortTitle: shortTitle ?? abbreviation,
    abbreviation,
    slug,
    type,
    date: metaPartial.date ?? null,
    number: metaPartial.number ?? null,
    ministry: metaPartial.ministry ?? null,
    status: metaPartial.status ?? null,
    rawXmlPath: options.filePath,
    sourceUpdatedAt: metaPartial.sourceUpdatedAt ?? null,
    canonicalLovdataUrl: buildLovdataUrl(documentKey),
    legalCitationForms: citationForms,
    legalAreas: metaPartial.legalAreas ?? [],
    language: metaPartial.language ?? "nb",
  };

  const orderCounter = { value: 0 };
  const nodes: ParsedLegalNode[] = [];

  $("main section.section, main > section").each((_, el) => {
    const node = parseNodeTree($, el, orderCounter);
    if (node) nodes.push(node);
  });

  // Fallback: parse articles directly if no sections found
  if (nodes.length === 0) {
    $("main article.legalArticle").each((_, el) => {
      const node = parseNodeTree($, el, orderCounter);
      if (node) nodes.push(node);
    });
  }

  const explicitLinks = extractExplicitLinks($, "main");

  return { meta, nodes, explicitLinks };
}

export function flattenNodes(
  nodes: ParsedLegalNode[],
  parentSlugPath: string | null = null
): ParsedLegalNode[] {
  const result: ParsedLegalNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children.length > 0) {
      result.push(...flattenNodes(node.children, node.slugPath));
    }
  }
  return result;
}
