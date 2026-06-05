import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <MarketingShell>
      <section className="bg-background py-16">
        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold text-foreground">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted">Last updated: {new Date().getFullYear()}</p>
          <div className="mt-8 space-y-6 text-muted">
            <div>
              <h2 className="text-lg font-semibold text-foreground">1. Acceptance</h2>
              <p>By using SmarThinkerz Marketing Suite, you agree to these terms and our Privacy Policy.</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">2. Subscriptions & billing</h2>
              <p>
                Paid plans are billed through our hosted payment provider on a monthly or yearly
                cycle. You may upgrade, downgrade, or cancel at any time. Failed payments enter a
                grace period before access is restricted.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">3. Acceptable use</h2>
              <p>
                You agree not to use the platform for unlawful activity, spam, or to generate
                content that violates applicable laws or third-party rights.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">4. AI-generated content</h2>
              <p>
                AI output is provided as-is. You are responsible for reviewing and ensuring the
                accuracy and compliance of generated content before publication.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">5. Liability</h2>
              <p>
                The platform is provided without warranty to the extent permitted by law. Self-hosted
                deployments are operated at your own risk.
              </p>
            </div>
          </div>
        </article>
      </section>
    </MarketingShell>
  );
}
