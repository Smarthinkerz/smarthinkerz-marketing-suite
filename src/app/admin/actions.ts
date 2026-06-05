"use server";

import { createClient } from "@/lib/supabase/server";
import { isSetupMode } from "@/lib/session";
import { PLANS, TIER_ORDER, type Tier } from "@/lib/plans";
import type { Role, SubscriptionStatus } from "@/lib/types";

export interface AdminKpis {
  totalUsers: number;
  activeSubs: number;
  mrr: number;
  churnRate: number;
}

export interface RevenueByTier {
  tier: Tier;
  name: string;
  subscribers: number;
  mrr: number;
}

export interface SignupPoint {
  month: string;
  signups: number;
  revenue: number;
}

export interface AdminAnalytics {
  kpis: AdminKpis;
  revenueByTier: RevenueByTier[];
  signupTrend: SignupPoint[];
  statusBreakdown: { status: SubscriptionStatus; count: number }[];
}

export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  tier: Tier;
  status: SubscriptionStatus;
  created_at: string;
}

function demoUsers(): AdminUserRow[] {
  const names = [
    ["Sarah Lin", "sarah@northwind.co", "business", "active"],
    ["Marcus Reed", "marcus@brightline.io", "pro", "active"],
    ["Aisha Karim", "aisha@cedar.co", "enterprise", "active"],
    ["David Cohen", "david@example.com", "basic", "trialing"],
    ["Lena Park", "lena@example.com", "pro", "past_due"],
    ["Tom Alvarez", "tom@example.com", "basic", "canceled"],
    ["Priya Nair", "priya@example.com", "business", "active"],
    ["Omar Said", "omar@example.com", "pro", "active"],
  ] as const;
  return names.map((n, i) => ({
    id: `demo-${i}`,
    full_name: n[0],
    email: n[1],
    role: i === 0 ? "admin" : "subscriber",
    tier: n[2] as Tier,
    status: n[3] as SubscriptionStatus,
    created_at: new Date(Date.now() - 86400000 * (i * 9 + 3)).toISOString(),
  }));
}

function buildAnalytics(users: AdminUserRow[]): AdminAnalytics {
  const active = users.filter((u) => u.status === "active" || u.status === "trialing");
  const revenueByTier: RevenueByTier[] = TIER_ORDER.map((t) => {
    const subs = active.filter((u) => u.tier === t).length;
    return { tier: t, name: PLANS[t].name, subscribers: subs, mrr: subs * PLANS[t].priceMonthly };
  });
  const mrr = revenueByTier.reduce((s, r) => s + r.mrr, 0);
  const churned = users.filter((u) => u.status === "canceled").length;
  const churnRate = users.length ? Math.round((churned / users.length) * 1000) / 10 : 0;

  const statusMap = new Map<SubscriptionStatus, number>();
  users.forEach((u) => statusMap.set(u.status, (statusMap.get(u.status) ?? 0) + 1));

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const signupTrend: SignupPoint[] = months.map((m, i) => ({
    month: m,
    signups: Math.max(2, Math.round((users.length / 6) * (0.6 + i * 0.18))),
    revenue: Math.round((mrr / 6) * (0.5 + i * 0.2)),
  }));

  return {
    kpis: {
      totalUsers: users.length,
      activeSubs: active.length,
      mrr,
      churnRate,
    },
    revenueByTier,
    signupTrend,
    statusBreakdown: [...statusMap.entries()].map(([status, count]) => ({ status, count })),
  };
}

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  if (isSetupMode()) return demoUsers();
  const supabase = await createClient();
  if (!supabase) return [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false });
  const { data: subs } = await supabase.from("subscriptions").select("user_id, tier, status");
  const subMap = new Map((subs ?? []).map((s) => [s.user_id, s]));
  return (profiles ?? []).map((p) => {
    const s = subMap.get(p.id);
    return {
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      role: (p.role as Role) ?? "subscriber",
      tier: (s?.tier as Tier) ?? "basic",
      status: (s?.status as SubscriptionStatus) ?? "active",
      created_at: p.created_at,
    };
  });
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const users = await getAdminUsers();
  return buildAnalytics(users);
}

export async function setUserRole(userId: string, role: Role): Promise<{ ok: boolean; error?: string }> {
  if (isSetupMode()) return { ok: false, error: "Connect Supabase to change roles. (Demo mode)" };
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not configured." };
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function setUserTier(userId: string, tier: Tier): Promise<{ ok: boolean; error?: string }> {
  if (isSetupMode()) return { ok: false, error: "Connect Supabase to change plans. (Demo mode)" };
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not configured." };
  const { error } = await supabase
    .from("subscriptions")
    .upsert({ user_id: userId, tier, status: "active", updated_at: new Date().toISOString() });
  return error ? { ok: false, error: error.message } : { ok: true };
}
