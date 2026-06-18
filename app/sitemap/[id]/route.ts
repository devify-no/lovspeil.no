import { NextResponse } from "next/server";
import {
  buildSitemapChunkXml,
  getSiteBaseUrl,
  parseSitemapId,
} from "@/lib/sitemap";

export const revalidate = 86400;

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { id: rawId } = await params;
  const id = parseSitemapId(rawId);
  if (id === null) {
    return new NextResponse("Not found", { status: 404 });
  }

  const baseUrl = getSiteBaseUrl();
  const xml = await buildSitemapChunkXml(baseUrl, id);
  if (!xml) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate",
    },
  });
}
