import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const allItems: BreadcrumbItem[] = [{ label: "Forside", href: "/" }, ...items];

  return (
    <nav aria-label="Brødsmulesti" className="mb-4 text-sm text-stone-500">
      <ol className="flex flex-wrap items-center gap-1">
        {allItems.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-stone-900 hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-stone-800" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
