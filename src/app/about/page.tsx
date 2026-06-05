import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <MarketingShell>
      <section className="bg-background py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">About</h1>
          <div className="mt-6 space-y-4 text-muted">
            <p>
              SmarThinkerz Marketing Suite is an AI-native, all-in-one marketing platform built for teams that
              want power without lock-in. It unifies campaigns, content, SEO, social, email,
              chatbots, media generation, e-commerce optimization, ad management, and analytics in
              one place.
            </p>
            <p>
              The platform is self-hostable on a Supabase + Next.js stack, so you fully own your
              data and infrastructure. No vendor lock-in, no hidden data silos — just a fast,
              modern toolkit designed to scale with your growth.
            </p>
            <p>
              Our mission is simple: give marketers a category-defining toolset that turns intent
              into insight into action, with the control and transparency serious teams demand.
            </p>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
