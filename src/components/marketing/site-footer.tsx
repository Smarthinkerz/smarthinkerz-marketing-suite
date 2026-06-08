import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import type { CmsFooter } from "@/lib/types";

export function SiteFooter({ footer }: { footer: CmsFooter }) {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
          <div className="max-w-xs">
            <Logo href={null} />
            <p className="mt-3 text-sm text-muted">{footer.tagline}</p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {footer.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-sm text-muted sm:flex-row sm:items-center">
          <span>{footer.copyright}</span>
          <Link
            href="/auth/sign-in?redirect=/admin"
            className="text-xs text-muted/50 transition-colors hover:text-muted"
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
