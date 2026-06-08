import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  title: "Checkout — SmarThinkerz Marketing Suite",
  description: "Complete your subscription to SmarThinkerz Marketing Suite.",
};

interface CheckoutPageProps {
  searchParams: Promise<{
    plan?: string;   // planKey e.g. "smarthinkerz-pro-monthly"
    tier?: string;   // tier alias: basic | pro | business | enterprise
    cycle?: string;  // monthly | yearly
  }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in?redirect=/checkout");
  }

  const params = await searchParams;

  return (
    <CheckoutClient
      user={user}
      initialPlan={params.plan}
      initialTier={params.tier}
      initialCycle={(params.cycle as "monthly" | "yearly") ?? "monthly"}
      tapConfigured={config.tap.isConfigured}
    />
  );
}
