/**
 * Brand Guardrails — server-side data access.
 * Reads/writes the brand_guardrails table introduced in migration 0003.
 */

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/workspace";
// Re-export client-safe types and constants from brand-types.ts
export type { PlatformRule, BrandGuardrails, BrandGuardrailsInput } from "@/lib/brand-types";
export { DEFAULT_GUARDRAILS } from "@/lib/brand-types";
import type { BrandGuardrails, BrandGuardrailsInput } from "@/lib/brand-types";

// ---------------------------------------------------------------------------
// Data access
// ---------------------------------------------------------------------------

export async function getBrandGuardrails(
  workspaceId?: string,
): Promise<BrandGuardrails | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  let query = supabase
    .from("brand_guardrails")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error("[brand] getBrandGuardrails:", error.message);
    return null;
  }
  return data as BrandGuardrails | null;
}

export async function saveBrandGuardrails(
  input: BrandGuardrailsInput,
): Promise<{ ok: boolean; error?: string; data?: BrandGuardrails }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not configured" };
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Unauthenticated" };

  // Upsert: if a row exists for this workspace, update it; otherwise insert
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
