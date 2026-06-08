import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PricingCards } from "@/components/marketing/pricing-cards";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing across four tiers.",
};

const FAQ = [
  {
    q: "Can I change plans later?",
    a: "Yes. Upgrade or downgrade anytime from your billing dashboard; changes apply on your next cycle.",
  },
  {
    q: "What payment methods are supported?",
    a: "Billing is processed securely through Tap Payments, supporting Visa, Mastercard, AMEX, mada, KNET, and other regional payment methods. Installment options (2–4 payments) are available on all plans.",
  },
  {
    q: "Can I pay in installments?",
    a: "Yes. At checkout you can split your payment into 2, 3, or 4 monthly installments. Each installment is charged separately via Tap Payments.",
  },
  {
    q: "Is my data portable?",
    a: "Absolutely. The platform is self-hostable on your own Supabase project, so you fully own your data.",
  },
  {
    q: "Do you offer a grace period?",
    a: "Yes. If a payment fails, your access continues during a grace window before any restriction applies.",
  },
];

export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Pricing that scales with you
            </h1>
            <p className="mt-4 text-lg text-muted">
              Choose a plan and unlock AI-powered marketing tools instantly. Cancel anytime.
            </p>
          </div>
          <div className="mt-14">
            <PricingCards />
          </div>
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-foreground">
            Frequently asked questions
          </h2>
          <dl className="mt-8 space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="rounded-lg border border-border bg-background p-6">
                <dt className="font-semibold text-foreground">{item.q}</dt>
                <dd className="mt-2 text-sm text-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </MarketingShell>
  );
}
