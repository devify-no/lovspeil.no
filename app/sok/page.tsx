import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPageClient } from "@/components/search/search-page";
import { pageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = pageMetadata({
  title: "Søk",
  description: "Søk i norske lover og forskrifter på Lovspeil.",
  path: "/sok",
});

export default function SokPage() {
  return (
    <Suspense>
      <SearchPageClient />
    </Suspense>
  );
}
