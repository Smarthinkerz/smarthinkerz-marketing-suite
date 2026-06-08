/**
 * Digital Asset Management (DAM) — server-side data access.
 * Reads/writes the assets table introduced in migration 0003.
 * Files are stored in Supabase Storage bucket "assets".
 */

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/workspace";
// Re-export client-safe types from asset-types.ts
export type { AssetType, Asset } from "@/lib/asset-types";
import type { Asset, AssetType } from "@/lib/asset-types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mimeToType(mime: string): AssetType {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (
    mime === "application/pdf" ||
    mime.startsWith("application/vnd") ||
    mime.startsWith("text/")
  )
    return "document";
  return "other";
}

// ---------------------------------------------------------------------------
// Data access
// ---------------------------------------------------------------------------

export async function getAssets(workspaceId?: string): Promise<Asset[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase
    .from("assets")
    .select("*")
    .order("created_at", { ascending: false });

  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[assets] getAssets:", error.message);
    return [];
  }
  return (data ?? []) as Asset[];
}

export async function uploadAsset(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
  asset?: Asset;
}> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not configured" };
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const file = formData.get("file") as File | null;
  const workspaceId = (formData.get("workspaceId") as string) || "default";
  const tags = ((formData.get("tags") as string) || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!file) return { ok: false, error: "No file provided" };

  const ext = file.name.split(".").pop() ?? "bin";
  const storagePath = `${workspaceId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  // Upload to Supabase Storage
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("assets")
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) return { ok: false, error: uploadError.message };

  // Get public URL
  const { data: urlData } = supabase.storage.from("assets").getPublicUrl(storagePath);

  // Insert record
  const { data, error: insertError } = await supabase
    .from("assets")
    .insert({
      workspace_id: workspaceId,
      uploader_id: user.id,
      name: file.name,
      type: mimeToType(file.type),
      mime_type: file.type,
      size_bytes: file.size,
      storage_path: storagePath,
      public_url: urlData?.publicUrl ?? null,
      tags,
    })
    .select()
    .single();

  if (insertError) return { ok: false, error: insertError.message };

  await writeAuditLog({
    workspace_id: workspaceId,
    actor_id: user.id,
    verb: "uploaded_asset",
    target: `asset:${data.id}`,
    payload: { name: file.name, type: mimeToType(file.type) },
  });

  return { ok: true, asset: data as Asset };
}

export async function deleteAsset(assetId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not configured" };
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { data: asset } = await supabase
    .from("assets")
    .select("storage_path, workspace_id")
    .eq("id", assetId)
    .maybeSingle();

  if (!asset) return { ok: false, error: "Asset not found" };

  // Remove from storage
  await supabase.storage.from("assets").remove([asset.storage_path]);

  // Remove record
  const { error } = await supabase.from("assets").delete().eq("id", assetId);
  if (error) return { ok: false, error: error.message };

  await writeAuditLog({
    workspace_id: asset.workspace_id,
    actor_id: user.id,
    verb: "deleted_asset",
    target: `asset:${assetId}`,
  });

  return { ok: true };
}
