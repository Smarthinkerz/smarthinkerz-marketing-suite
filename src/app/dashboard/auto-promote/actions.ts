"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/workspace";
import { generateJson } from "@/lib/ai";
import { runToolAction, type ActionState } from "@/lib/tool-runner";
import { saveDraftPost } from "@/lib/content-workflow";

export interface GeneratedPost {
  platform: string;
  body: string;
  hashtags: string[];
  angle: string;
}

export interface AutoPromoteResult {
  posts: GeneratedPost[];
  message: string;
}

export interface WorkflowResult {
  ok: boolean;
  error?: string;
}

/**
 * Submit a draft post for review.
 * Inlined here to avoid re-exporting from a module that imports next/headers.
 */
export async function submitForReview(postId: string): Promise<WorkflowResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not configured" };
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { data: post, error: fetchErr } = await supabase
    .from("content_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();
  if (fetchErr || !post) return { ok: false, error: "Post not found" };
  if (!["draft", "changes_requested"].includes(post.content_status)) {
    return { ok: false, error: `Cannot submit from state: ${post.content_status}` };
  }

  const { error: updateErr } = await supabase
    .from("content_posts")
    .update({ content_status: "in_review" })
    .eq("id", postId);
  if (updateErr) return { ok: false, error: updateErr.message };

  await writeAuditLog({
    workspace_id: post.workspace_id,
    actor_id: user.id,
    verb: "submitted_for_review",
    target: `content_post:${postId}`,
  });
  return { ok: true };
}

/**
 * Generates content posts for a promotion profile and saves them as DRAFTS.
 * No auto-publish: every generated post must go through the approval workflow.
 */
export async function generatePromotionDrafts(input: {
  brandName: string;
  brandDescription: string;
  targetAudience: string;
  platforms: string[];
  workspaceId?: string;
}): Promise<ActionState<AutoPromoteResult>> {
  const { brandName, brandDescription, targetAudience, platforms, workspaceId } = input;

  const prompt = `Brand: ${brandName}\nDescription: ${brandDescription}\nTarget audience: ${targetAudience}\nPlatforms: ${platforms.join(", ")}`;

  return runToolAction("autopromote", prompt, async () => {
    const result = await generateJson<AutoPromoteResult>({
      system: `You are an expert social media strategist. Generate one post per platform for the given brand. Each post must be platform-appropriate in length and tone. Return JSON with: posts (array of { platform, body, hashtags (array, no # prefix), angle (the content angle used) }), message (brief summary).`,
      prompt,
      temperature: 0.75,
    });

    if (workspaceId && result.posts?.length) {
      const user = await getSessionUser();
      if (user) {
        await Promise.all(
          result.posts.map((post) =>
            saveDraftPost({
              workspaceId,
              platform: post.platform,
              body: post.body,
              hashtags: post.hashtags,
              angle: post.angle,
            }),
          ),
        );
      }
    }

    return result;
  });
}
