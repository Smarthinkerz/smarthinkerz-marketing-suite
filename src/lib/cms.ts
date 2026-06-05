import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CMS_CONTENT } from "@/lib/cms-default";
import type { CmsContent } from "@/lib/types";

/**
 * Loads homepage CMS content from Supabase. Falls back to the canonical
 * default content when Supabase is unconfigured or the row is missing, so the
 * public site always renders fully.
 */
export async function getHomepageContent(): Promise<CmsContent> {
  const supabase = await createClient();
  if (!supabase) return DEFAULT_CMS_CONTENT;

  const { data } = await supabase
    .from("cms_content")
    .select("data")
    .eq("id", "homepage")
    .maybeSingle();

  if (!data?.data) return DEFAULT_CMS_CONTENT;
  return { ...DEFAULT_CMS_CONTENT, ...(data.data as Partial<CmsContent>) } as CmsContent;
}
