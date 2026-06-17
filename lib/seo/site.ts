import type { Metadata } from "next";

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://lovspeil.no";
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

export const siteName = "Lovspeil";

export const defaultDescription =
  "Gratis, uoffisiell og leservennlig tilgang til norske lover og sentrale forskrifter. Lovdata er autoritativ kilde.";

export function pageMetadata({
  title,
  description = defaultDescription,
  path,
  absolute = false,
}: {
  title: string;
  description?: string;
  path: string;
  absolute?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  const ogTitle = absolute ? title : `${title} – ${siteName}`;
  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: ogTitle,
      description,
      url,
      siteName,
      locale: "nb_NO",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: ogTitle,
      description,
    },
  };
}
