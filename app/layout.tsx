import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteHeader, SiteFooter } from "@/components/layout/site-chrome";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lovspeil – Norske lover og forskrifter",
    template: "%s – Lovspeil",
  },
  description:
    "Gratis, uoffisiell og leservennlig tilgang til norske lover og sentrale forskrifter. Lovdata er autoritativ kilde.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://lovspeil.no"),
  openGraph: {
    type: "website",
    locale: "nb_NO",
    siteName: "Lovspeil",
  },
  robots: {
    index: true,
    follow: true,
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
