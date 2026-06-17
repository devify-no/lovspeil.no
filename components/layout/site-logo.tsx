import Link from "next/link";
import Image from "next/image";

interface SiteLogoProps {
  className?: string;
  iconClassName?: string;
}

export function SiteLogo({ className = "", iconClassName = "h-7 w-7" }: SiteLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/favicon.svg"
        alt=""
        width={28}
        height={28}
        className={`rounded-md ${iconClassName}`}
      />
      <span>Lovspeil</span>
    </span>
  );
}

export function SiteLogoLink({
  className = "text-xl font-semibold text-stone-900",
}: {
  className?: string;
}) {
  return (
    <Link href="/" className={`hover:text-stone-700 ${className}`}>
      <SiteLogo />
    </Link>
  );
}
