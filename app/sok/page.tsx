import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPageClient } from "@/components/search/search-page";

export const metadata: Metadata = {
  title: "Søk",
  description: "Søk i norske lover og forskrifter på Lovspeil.",
};

export default function SokPage() {
  return (
    <Suspense>
      <SearchPageClient />
    </Suspense>
  );
}
