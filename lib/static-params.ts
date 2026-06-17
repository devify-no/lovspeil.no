import { getAllSlugs } from "@/lib/queries";
import { isStaticBuildableSlug } from "@/lib/lovdata/slug";

export async function generateLawSlugParams() {
  try {
    const slugs = await getAllSlugs("law");
    return slugs
      .filter(({ slug }) => isStaticBuildableSlug(slug))
      .map(({ slug }) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateRegulationSlugParams() {
  try {
    const slugs = await getAllSlugs("regulation");
    return slugs
      .filter(({ slug }) => isStaticBuildableSlug(slug))
      .map(({ slug }) => ({ slug }));
  } catch {
    return [];
  }
}
