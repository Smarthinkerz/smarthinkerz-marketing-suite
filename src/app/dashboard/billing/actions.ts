"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { isSetupMode } from "@/lib/session";
import { getMonthlyUsage } from "@/lib/usage";
import type { Invoice } from "@/lib/types";

export interface BillingData {
  invoices: Invoice[];
  usage: number;
}

export async function getBillingData(userId: string): Promise<BillingData> {
  if (isSetupMode()) {
    return {
      usage: 327,
      invoices: [
        { id: "inv-1", user_id: userId, amount: 79, currency: "USD", status: "paid", hub_charge_id: "chg_demo_1", created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
        { id: "inv-2", user_id: userId, amount: 79, currency: "USD", status: "paid", hub_charge_id: "chg_demo_2", created_at: new Date(Date.now() - 86400000 * 35).toISOString() },
      ],
    };
  }

  const supabase = await createClient();
  const user = await getSessionUser();
  if (!supabase || !user) return { invoices: [], usage: 0 };

  const [{ data: invoices }, usage] = await Promise.all([
    supabase.from("invoices").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    getMonthlyUsage(user.id),
  ]);

  return { invoices: (invoices as Invoice[]) ?? [], usage };
}
