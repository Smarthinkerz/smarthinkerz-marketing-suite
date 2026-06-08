import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  title: "Checkout — Smarthinkerz Academy",
  description: "Complete your enrollment in a Smarthinkerz Academy program.",
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
  }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in?redirect=/checkout");
  }

  const params = await searchParams;
  // Accept both ?track= and legacy ?plan= param
  const initialTrack = params.track ?? params.plan;

  return (
    <CheckoutClient
      user={user}
      initialTrack={initialTrack}
      tapConfigured={config.tap.isConfigured}
    />
  );
}
