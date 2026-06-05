import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { TOOLS } from "@/lib/tools";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Product Demo",
  description: "Take a guided tour of the AI marketing suite.",
};

export default function DemoPage() {
  return (
    <MarketingShell>
      <section className="bg-background py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              See the suite in action
            </h1>
            <p className="mt-4 text-lg text-muted">
              Explore the ten integrated tools. Create a free account to try them live with your
              own data.
            </p>
            <div className="mt-8 flex justify-center">
              <Button href="/auth/sign-up" size="lg">
                Start your account <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {TOOLS.map((tool) => (
              <div key={tool.key} className="rounded-2xl border border-border bg-surface p-6">
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tool.accent} text-white`}>
                  <Icon name={tool.icon} className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{tool.name}</h3>
                <p className="mt-1.5 text-sm text-muted">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
