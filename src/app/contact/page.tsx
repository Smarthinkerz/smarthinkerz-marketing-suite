import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ContactForm } from "@/components/marketing/contact-form";
import { Mail, MapPin, MessageSquare } from "lucide-react";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <MarketingShell>
      <section className="bg-background py-16">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              Get in touch
            </h1>
            <p className="mt-4 text-lg text-muted">
              Questions about plans, self-hosting, or enterprise needs? Send us a message and our
              team will respond shortly.
            </p>
            <ul className="mt-8 space-y-4 text-sm">
              <li className="flex items-center gap-3 text-foreground">
                <Mail className="h-5 w-5 text-primary" /> sales@smarthinkerz.com
              </li>
              <li className="flex items-center gap-3 text-foreground">
                <MessageSquare className="h-5 w-5 text-primary" /> Live chat for Business & Enterprise
              </li>
              <li className="flex items-center gap-3 text-foreground">
                <MapPin className="h-5 w-5 text-primary" /> Remote-first, worldwide
              </li>
            </ul>
          </div>
          <ContactForm />
        </div>
      </section>
    </MarketingShell>
  );
}
