"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { isSetupMode } from "@/lib/session";
import { DEFAULT_CMS_CONTENT } from "@/lib/cms-default";
import { getHomepageContent } from "@/lib/cms";
import type { CmsContent, CmsVersion } from "@/lib/types";

export interface CmsState {
  content: CmsContent;
  versions: CmsVersion[];
  setupMode: boolean;
}

// In setup mode we keep edits in module memory so the editor is fully usable
// (non-persistent) without a database. This resets on server restart.
let demoContent: CmsContent | null = null;
let demoVersions: CmsVersion[] = [];

export async function getCmsState(): Promise<CmsState> {
  if (isSetupMode()) {
    return {
      content: demoContent ?? DEFAULT_CMS_CONTENT,
      versions: demoVersions,
      setupMode: true,
    };
  }

  const supabase = await createClient();
  const content = await getHomepageContent();
  let versions: CmsVersion[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("cms_versions")
      .select("*")
      .eq("content_id", "homepage")
      .order("created_at", { ascending: false })
      .limit(25);
    versions = (data as CmsVersion[]) ?? [];
  }
  return { content, versions, setupMode: false };
}

export async function saveCmsContent(
  content: CmsContent,
  label?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (isSetupMode()) {
    // snapshot previous, then set current
    demoVersions = [
      {
        id: crypto.randomUUID(),
        label: label || `Edit ${new Date().toLocaleString()}`,
        data: demoContent ?? DEFAULT_CMS_CONTENT,
        created_by: "demo-admin",
        created_at: new Date().toISOString(),
      },
      ...demoVersions,
    ].slice(0, 25);
    demoContent = content;
    revalidatePath("/");
    revalidatePath("/admin/cms");
    return { ok: true };
  }

  const supabase = await createClient();
  const user = await getSessionUser();
  if (!supabase || !user) return { ok: false, error: "Not authenticated." };
  if (user.role !== "admin") return { ok: false, error: "Admin access required." };

  // Snapshot the existing published content as a version before overwriting.
  const previous = await getHomepageContent();
  await supabase.from("cms_versions").insert({
    content_id: "homepage",
    label: label || `Edit ${new Date().toLocaleString()}`,
    data: previous,
    created_by: user.id,
  });

  const { error } = await supabase
    .from("cms_content")
    .upsert({ id: "homepage", data: content, updated_by: user.id, updated_at: new Date().toISOString() });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/admin/cms");
  return { ok: true };
}

export async function restoreCmsVersion(versionId: string): Promise<{ ok: boolean; error?: string }> {
  if (isSetupMode()) {
    const v = demoVersions.find((x) => x.id === versionId);
    if (!v) return { ok: false, error: "Version not found." };
    demoContent = v.data;
    revalidatePath("/");
    return { ok: true };
  }
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!supabase || !user || user.role !== "admin") return { ok: false, error: "Admin access required." };
  const { data: v } = await supabase.from("cms_versions").select("data").eq("id", versionId).maybeSingle();
  if (!v?.data) return { ok: false, error: "Version not found." };
  return saveCmsContent(v.data as CmsContent, "Restored from version history");
}

export async function resetCmsToDefault(): Promise<{ ok: boolean; error?: string }> {
  return saveCmsContent(DEFAULT_CMS_CONTENT, "Reset to default");
}
