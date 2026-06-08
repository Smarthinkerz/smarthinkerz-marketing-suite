"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/workspace";
import type { BrandGuardrails, BrandGuardrailsInput } from "@/lib/brand";

export async function saveBrandGuardrails(
  input: BrandGuardrailsInput,
): Promise<{ ok: boolean; error?: string; data?: BrandGuardrails }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not configured" };
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { data, error } = await supabase
    .from("brand_guardrails")
    .upsert(
      {
        workspace_id: input.workspace_id,
        voice_pillars: input.voice_pillars,
        banned_terms: input.banned_terms,
        required_hashtags: input.required_hashtags,
        optional_hashtags: input.optional_hashtags,
        platform_rules: input.platform_rules,
      },
      { onConflict: "workspace_id" },
    )
    .select()
    .single();
  if (error) return { ok: false, error: error.message };

  await writeAuditLog({
    workspace_id: input.workspace_id,
    actor_id: user.id,
    verb: "updated_brand_guardrails",
    target: `brand_guardrails:${data.id}`,
  });
  return { ok: true, data: data as BrandGuardrails };
}
