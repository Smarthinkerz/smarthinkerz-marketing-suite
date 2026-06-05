"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { isSetupMode } from "@/lib/session";
import type { Campaign } from "@/lib/types";

/** In-memory demo campaigns used only in setup mode (no Supabase). */
const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: "demo-1",
    user_id: "demo-user",
    name: "Summer Sale 2026",
    channels: ["facebook", "instagram", "email"],
    status: "active",
    budget: 5000,
    spend: 3120,
    impressions: 248000,
    clicks: 6200,
    conversions: 412,
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: "demo-2",
    user_id: "demo-user",
    name: "Product Launch — Q3",
    channels: ["google", "linkedin"],
    status: "active",
    budget: 8000,
    spend: 5400,
    impressions: 410000,
    clicks: 9800,
    conversions: 730,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "demo-3",
    user_id: "demo-user",
    name: "Retargeting — Cart Abandoners",
    channels: ["facebook", "email"],
    status: "paused",
    budget: 2000,
    spend: 1850,
    impressions: 96000,
    clicks: 4100,
    conversions: 380,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
];

export async function listCampaigns(): Promise<Campaign[]> {
  if (isSetupMode()) return DEMO_CAMPAIGNS;
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!supabase || !user) return [];
  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return (data as Campaign[]) ?? [];
}

export interface CreateCampaignInput {
  name: string;
  channels: string[];
  budget: number;
  status: string;
}

export async function createCampaign(
  input: CreateCampaignInput,
): Promise<{ ok: boolean; error?: string }> {
  if (isSetupMode()) {
    // Demo mode is read-only for persistence; surface a friendly notice.
    return { ok: false, error: "Connect Supabase to save campaigns. (Demo mode)" };
  }
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!supabase || !user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase.from("campaigns").insert({
    user_id: user.id,
    name: input.name,
    channels: input.channels,
    budget: input.budget,
    status: input.status,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/campaigns");
  return { ok: true };
}

export async function updateCampaignStatus(
  id: string,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  if (isSetupMode()) return { ok: false, error: "Connect Supabase to edit campaigns. (Demo mode)" };
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!supabase || !user) return { ok: false, error: "Not signed in." };
  const { error } = await supabase
    .from("campaigns")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/campaigns");
  return { ok: true };
}

export async function deleteCampaign(id: string): Promise<{ ok: boolean; error?: string }> {
  if (isSetupMode()) return { ok: false, error: "Connect Supabase to delete campaigns. (Demo mode)" };
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!supabase || !user) return { ok: false, error: "Not signed in." };
  const { error } = await supabase.from("campaigns").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/campaigns");
  return { ok: true };
}
