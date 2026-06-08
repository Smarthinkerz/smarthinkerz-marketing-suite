import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PricingCards } from "./pricing-cards";
import type { CmsContent } from "@/lib/types";

export function Hero({ hero }: { hero: CmsContent["hero"] }) {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18]"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, var(--primary) 0%, transparent 60%), radial-gradient(40% 40% at 80% 20%, var(--accent) 0%, transparent 60%)",
        }}
      />
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 lg:px-8 lg:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-muted">
            <Sparkles className="h-4 w-4 text-primary" />
            {hero.eyebrow}
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {hero.headline}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">{hero.subheadline}</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/auth/sign-up" size="lg" className="w-full sm:w-auto">
              {hero.ctaPrimary}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="/demo" variant="outline" size="lg" className="w-full sm:w-auto">
              {hero.ctaSecondary}
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" /> Self-hostable & data-owned
            </span>
            <span className="inline-flex items-center gap-2">
              <Zap className="h-4 w-4 text-warning" /> 10 tools in one platform
            </span>
            <span className="inline-flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" /> No Firebase — Supabase + Next.js
            </span>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="rounded-xl border border-border bg-surface p-2 shadow-2xl">
            <div className="rounded-lg bg-primary p-8 sm:p-12">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { k: "Tools", v: "10" },
                  { k: "Channels", v: "6+" },
                  { k: "Tiers", v: "4" },
                  { k: "Uptime", v: "99.9%" },
                ].map((s) => (
                  <div key={s.k} className="rounded-xl bg-white/15 p-4 text-center backdrop-blur">
                    <div className="text-3xl font-extrabold text-white">{s.v}</div>
                    <div className="text-xs font-medium uppercase tracking-wide text-white/80">
                      {s.k}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Features({ features }: { features: CmsContent["features"] }) {
  return (
    <section id="features" className="scroll-mt-20 bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {features.title}
          </h2>
          <p className="mt-4 text-lg text-muted">{features.subtitle}</p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.items.map((item) => (
            <div
              key={item.title}
              className="group rounded-lg border border-border bg-surface p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon name={item.icon} className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingSection({ pricing }: { pricing: CmsContent["pricing"] }) {
  return (
    <section id="pricing" className="scroll-mt-20 bg-surface py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {pricing.title}
          </h2>
          <p className="mt-4 text-lg text-muted">{pricing.subtitle}</p>
        </div>
        <div className="mt-14">
          <PricingCards />
        </div>
        <p className="mt-8 text-center text-sm text-muted">
          Need a custom plan?{" "}
          <Link href="/contact" className="font-medium text-primary hover:underline">
            Talk to sales
          </Link>
        </p>
      </div>
    </section>
  );
}

export function Testimonials({ testimonials }: { testimonials: CmsContent["testimonials"] }) {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {testimonials.title}
          </h2>
          <p className="mt-4 text-lg text-muted">{testimonials.subtitle}</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.items.map((t, i) => (
            <figure key={i} className="rounded-lg border border-border bg-surface p-6 shadow-sm">
              <div className="flex gap-1 text-warning">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 text-foreground">“{t.quote}”</blockquote>
              <figcaption className="mt-5">
                <div className="font-semibold text-foreground">{t.author}</div>
                <div className="text-sm text-muted">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta({ finalCta }: { finalCta: CmsContent["finalCta"] }) {
  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-xl bg-primary px-8 py-14 text-center shadow-2xl sm:px-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {finalCta.headline}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">{finalCta.subheadline}</p>
          <div className="mt-8 flex justify-center">
            <Button
              href="/auth/sign-up"
              size="lg"
              className="bg-white text-primary shadow-lg hover:bg-white/90"
            >
              {finalCta.button}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
