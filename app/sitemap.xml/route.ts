import { NextResponse } from "next/server";
import { buildSitemapIndexXml, getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 86400;

export async function GET() {
  const baseUrl = getSiteBaseUrl();
  const xml = await buildSitemapIndexXml(baseUrl);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate",
    },
  });
}
