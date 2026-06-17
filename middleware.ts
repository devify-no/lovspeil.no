import { NextRequest, NextResponse } from "next/server";
import { documentSlugRedirects } from "@/lib/slug-redirects";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const match = pathname.match(/^\/(lover|forskrifter)\/([^/]+)(\/.*)?$/);
  if (!match) return NextResponse.next();

  const [, type, slug, rest = ""] = match;
  const newSlug = documentSlugRedirects[slug];
  if (!newSlug) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${type}/${newSlug}${rest}`;
  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: ["/lover/:path*", "/forskrifter/:path*"],
};
