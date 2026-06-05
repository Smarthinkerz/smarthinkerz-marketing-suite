import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { getHomepageContent } from "@/lib/cms";
import { getSessionUser } from "@/lib/auth";

/**
 * Server wrapper that provides the consistent marketing header + footer across
 * all public pages, including CMS-driven footer content and auth-aware CTAs.
 */
export async function MarketingShell({ children }: { children: React.ReactNode }) {
  const [content, user] = await Promise.all([getHomepageContent(), getSessionUser()]);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader signedIn={Boolean(user)} />
      <div className="flex-1">{children}</div>
      <SiteFooter footer={content.footer} />
    </div>
  );
}
