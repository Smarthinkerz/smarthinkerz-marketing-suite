import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  title: "Checkout — SmarThinkerz",
  description: "Complete your enrollment in a SmarThinkerz program.",
};

interface CheckoutPageProps {
  searchParams: Promise<{
    /**
     * Track slug (canonical or alias).
     * Canonical: "2-month-sprint" | "3-month-accelerator" | "6-month-professional" | "12-month-master"
     * Alias:     "foundations"    | "accelerator"          | "professional"          | "master"
     */
    track?: string;
    /** Legacy alias — also accepted as track identifier */
    plan?: string;
    /** Legacy tier param from billing page (e.g. "basic" | "pro" | "business" | "enterprise") */
    tier?: string;
  }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in?redirect=/checkout");
  }

  const params = await searchParams;
  // Accept ?track=, ?plan=, and legacy ?tier= (maps tier alias to track alias)
  const tierToAlias: Record<string, string> = {
    basic: "foundations",
    pro: "accelerator",
    business: "professional",
    enterprise: "master",
  };
  const initialTrack =
    params.track ??
    params.plan ??
    (params.tier ? tierToAlias[params.tier] ?? params.tier : undefined);

  return (
    <CheckoutClient
      user={user}
      initialTrack={initialTrack}
      tapConfigured={config.tap.isConfigured}
    />
  );
}
