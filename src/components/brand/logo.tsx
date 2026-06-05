import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { config } from "@/lib/config";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
  href?: string | null;
}

/**
 * Renders the product wordmark from `config.appName`. The final word receives
 * the brand gradient accent (e.g., "SmarThinkerz Marketing Suite" →
 * "SmarThinkerz Marketing" + "Suite"), keeping branding centralized and
 * configurable via NEXT_PUBLIC_APP_NAME.
 */
function BrandWordmark() {
  const name = config.appName.trim();
  const parts = name.split(" ");
  if (parts.length === 1) {
    return <span className="text-foreground">{name}</span>;
  }
  const accent = parts.pop() as string;
  const lead = parts.join(" ");
  return (
    <>
      <span className="text-foreground">{lead} </span>
      <span className="text-gradient-brand">{accent}</span>
    </>
  );
}

export function Logo({ className, showText = true, size = 36, href = "/" }: LogoProps) {
  const inner = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/logo.png"
        alt={`${config.appName} logo`}
        width={size}
        height={size}
        className="rounded-xl"
        priority
      />
      {showText && (
        <span className="text-lg font-bold tracking-tight">
          <BrandWordmark />
        </span>
      )}
    </span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} className="inline-flex items-center">
      {inner}
    </Link>
  );
}
