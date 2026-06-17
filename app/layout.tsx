import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteHeader, SiteFooter } from "@/components/layout/site-chrome";
import {
  absoluteUrl,
  defaultDescription,
  getSiteUrl,
  siteName,
} from "@/lib/seo/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${siteName} – Norske lover og forskrifter`,
    template: `%s – ${siteName}`,
  },
  description: defaultDescription,
  applicationName: siteName,
  keywords: [
    "lover",
    "forskrifter",
    "lovdata",
    "norsk lov",
    "paragraf",
    "jus",
    "Norge",
  ],
  authors: [{ name: "Dev AS", url: "https://www.devify.no" }],
  creator: "Dev AS",
  openGraph: {
    type: "website",
    locale: "nb_NO",
    siteName,
    title: `${siteName} – Norske lover og forskrifter`,
    description: defaultDescription,
    url: absoluteUrl("/"),
  },
  twitter: {
    card: "summary",
    title: `${siteName} – Norske lover og forskrifter`,
    description: defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nb">
      <body className={`${inter.className} flex min-h-screen flex-col bg-white text-stone-900 antialiased`}>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
