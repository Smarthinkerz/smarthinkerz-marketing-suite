import { MarketingShell } from "@/components/marketing/marketing-shell";
import {
  Hero,
  Features,
  PricingSection,
  Testimonials,
  FinalCta,
} from "@/components/marketing/home-sections";
import { getHomepageContent } from "@/lib/cms";

export default async function HomePage() {
  const content = await getHomepageContent();
  return (
    <MarketingShell>
      <Hero hero={content.hero} />
      <Features features={content.features} />
      <PricingSection pricing={content.pricing} />
      <Testimonials testimonials={content.testimonials} />
      <FinalCta finalCta={content.finalCta} />
    </MarketingShell>
  );
}
