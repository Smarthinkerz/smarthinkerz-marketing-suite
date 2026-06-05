"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { isSetupMode } from "@/lib/session";
import type { Campaign } from "@/lib/types";

export interface AnalyticsData {
  totals: { spend: number; impressions: number; clicks: number; conversions: number };
  ctr: number;
  cpc: number;
  convRate: number;
  channelBreakdown: { channel: string; conversions: number; spend: number }[];
  trend: { date: string; clicks: number; conversions: number }[];
  campaignPerformance: { name: string; conversions: number; ctr: number }[];
}

function buildFromCampaigns(campaigns: Campaign[]): AnalyticsData {
  const totals = campaigns.reduce(
    (acc, c) => {
      acc.spend += c.spend;
      acc.impressions += c.impressions;
      acc.clicks += c.clicks;
      acc.conversions += c.conversions;
      return acc;
    },
    { spend: 0, impressions: 0, clicks: 0, conversions: 0 },
  );

  const channelMap = new Map<string, { conversions: number; spend: number }>();
  for (const c of campaigns) {
    const per = c.channels.length || 1;
    for (const ch of c.channels) {
      const cur = channelMap.get(ch) ?? { conversions: 0, spend: 0 };
      cur.conversions += Math.round(c.conversions / per);
      cur.spend += Math.round(c.spend / per);
      channelMap.set(ch, cur);
    }
  }

  // 14-day synthetic trend derived from totals (deterministic, not random).
  const days = 14;
  const trend = Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - 1 - i) * 86400000);
    const weight = 0.5 + (i / days);
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      clicks: Math.round((totals.clicks / days) * weight),
      conversions: Math.round((totals.conversions / days) * weight),
    };
  });

  return {
    totals,
    ctr: totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0,
    cpc: totals.clicks ? totals.spend / totals.clicks : 0,
    convRate: totals.clicks ? (totals.conversions / totals.clicks) * 100 : 0,
    channelBreakdown: Array.from(channelMap.entries()).map(([channel, v]) => ({
      channel,
      ...v,
    })),
    trend,
    campaignPerformance: campaigns.map((c) => ({
      name: c.name,
      conversions: c.conversions,
      ctr: c.impressions ? (c.clicks / c.impressions) * 100 : 0,
    })),
  };
}

export async function getAnalytics(): Promise<AnalyticsData> {
  if (isSetupMode()) {
    const demo: Campaign[] = [
      { id: "1", user_id: "demo", name: "Summer Sale 2026", channels: ["facebook", "instagram", "email"], status: "active", budget: 5000, spend: 3120, impressions: 248000, clicks: 6200, conversions: 412, created_at: "" },
      { id: "2", user_id: "demo", name: "Product Launch — Q3", channels: ["google", "linkedin"], status: "active", budget: 8000, spend: 5400, impressions: 410000, clicks: 9800, conversions: 730, created_at: "" },
      { id: "3", user_id: "demo", name: "Retargeting", channels: ["facebook", "email"], status: "paused", budget: 2000, spend: 1850, impressions: 96000, clicks: 4100, conversions: 380, created_at: "" },
    ];
    return buildFromCampaigns(demo);
  }

  const supabase = await createClient();
  const user = await getSessionUser();
  if (!supabase || !user) return buildFromCampaigns([]);
  const { data } = await supabase.from("campaigns").select("*").eq("user_id", user.id);
  return buildFromCampaigns((data as Campaign[]) ?? []);
}
