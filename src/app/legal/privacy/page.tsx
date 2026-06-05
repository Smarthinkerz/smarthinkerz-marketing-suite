import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <section className="bg-background py-16">
        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold text-foreground">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted">Last updated: {new Date().getFullYear()}</p>
          <div className="prose mt-8 max-w-none space-y-6 text-muted">
            <div>
              <h2 className="text-lg font-semibold text-foreground">1. Data we collect</h2>
              <p>
                We collect account information (name, email), subscription details, and usage data
                necessary to operate the platform. When self-hosted, this data resides in your own
                Supabase project under your control.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">2. How we use data</h2>
              <p>
                Data is used to authenticate users, provide AI tooling, process payments through
                our hosted payment provider, and send transactional email via Resend. We do not
                sell personal data.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">3. Data ownership</h2>
              <p>
                Because the platform is self-hostable on Supabase, you own and control your data and
                may export or delete it at any time.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">4. Security</h2>
              <p>
                We apply row-level security, encryption in transit, and least-privilege access
                controls. You are responsible for securing your self-hosted deployment.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">5. Contact</h2>
              <p>For privacy requests, contact privacy@smarthinkerz.com.</p>
            </div>
          </div>
        </article>
      </section>
    </MarketingShell>
  );
}
