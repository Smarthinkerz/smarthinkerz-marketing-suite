"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { isSetupMode } from "@/lib/session";

const profileSchema = z.object({
  fullName: z.string().min(1, "Please enter your name").max(120),
});

export async function updateProfile(input: { fullName: string }): Promise<{ ok: boolean; error?: string }> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  if (isSetupMode()) return { ok: false, error: "Connect Supabase to save profile changes. (Demo mode)" };

  const supabase = await createClient();
  const user = await getSessionUser();
  if (!supabase || !user) return { ok: false, error: "Not signed in." };

  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from("profiles").update({ full_name: parsed.data.fullName }).eq("id", user.id),
    supabase.auth.updateUser({ data: { full_name: parsed.data.fullName } }),
  ]);
  if (e1 || e2) return { ok: false, error: (e1 ?? e2)?.message };
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function updatePassword(input: { password: string }): Promise<{ ok: boolean; error?: string }> {
  if (input.password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  if (isSetupMode()) return { ok: false, error: "Connect Supabase to change your password. (Demo mode)" };

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not signed in." };
  const { error } = await supabase.auth.updateUser({ password: input.password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
