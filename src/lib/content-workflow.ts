/**
 * Content post lifecycle workflow — server-side actions.
 * Handles state transitions, approval gating, and audit log writes.
 */

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/workspace";
import { canApprove, canEdit, type ContentStatus } from "@/lib/org-types";
import type { MyWorkspace } from "@/lib/org-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContentPost {
  id: string;
  user_id: string;
  workspace_id: string | null;
  platform: string;
  content_status: ContentStatus;
  angle: string | null;
  body: string;
  hashtags: string[];
  image_url: string | null;
  link_url: string | null;
  scheduled_for: string | null;
  published_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowResult {
  ok: boolean;
  error?: string;
  post?: ContentPost;
}

// ---------------------------------------------------------------------------
// Save / create a draft post
// ---------------------------------------------------------------------------

export async function saveDraftPost(input: {
  workspaceId: string;
  platform: string;
  body: string;
  hashtags?: string[];
  imageUrl?: string;
  linkUrl?: string;
  angle?: string;
}): Promise<WorkflowResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not configured" };
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { data, error } = await supabase
    .from("content_posts")
    .insert({
      user_id: user.id,
      workspace_id: input.workspaceId,
      platform: input.platform,
      content_status: "draft",
      body: input.body,
      hashtags: input.hashtags ?? [],
      image_url: input.imageUrl ?? null,
      link_url: input.linkUrl ?? null,
      angle: input.angle ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };

  await writeAuditLog({
    workspace_id: input.workspaceId,
    actor_id: user.id,
    verb: "created",
    target: `content_post:${data.id}`,
    payload: { platform: input.platform },
  });

  return { ok: true, post: data as ContentPost };
}

// ---------------------------------------------------------------------------
// Submit a draft for review
// ---------------------------------------------------------------------------

export async function submitForReview(postId: string): Promise<WorkflowResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not configured" };
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Unauthenticated" };

  // Fetch the post to check current state
  const { data: post, error: fetchErr } = await supabase
    .from("content_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();

  if (fetchErr || !post) return { ok: false, error: "Post not found" };
  if (!["draft", "changes_requested"].includes(post.content_status)) {
    return { ok: false, error: `Cannot submit from state: ${post.content_status}` };
  }

  const { data: updated, error: updateErr } = await supabase
    .from("content_posts")
    .update({ content_status: "in_review" })
    .eq("id", postId)
    .select()
    .single();

  if (updateErr) return { ok: false, error: updateErr.message };

  await writeAuditLog({
    workspace_id: post.workspace_id,
    actor_id: user.id,
    verb: "submitted_for_review",
    target: `content_post:${postId}`,
  });

  return { ok: true, post: updated as ContentPost };
}

// ---------------------------------------------------------------------------
// Approve a post
// ---------------------------------------------------------------------------

export async function approvePost(
  postId: string,
  rationale?: string,
): Promise<WorkflowResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not configured" };
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { data: post } = await supabase
    .from("content_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();

  if (!post) return { ok: false, error: "Post not found" };
  if (post.content_status !== "in_review") {
    return { ok: false, error: "Post is not in review" };
  }

  // Verify approver role via workspace_role RPC
  if (post.workspace_id) {
    const { data: role } = await supabase.rpc("workspace_role", {
      p_workspace_id: post.workspace_id,
    });
    if (!role || !canApprove(role as Parameters<typeof canApprove>[0])) {
      return { ok: false, error: "Insufficient permissions to approve" };
    }
  }

  // Write approval record
  await supabase.from("approvals").insert({
    content_post_id: postId,
    approver_id: user.id,
    status: "approved",
    rationale: rationale ?? null,
  });

  const { data: updated, error: updateErr } = await supabase
    .from("content_posts")
    .update({
      content_status: "approved",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .select()
    .single();

  if (updateErr) return { ok: false, error: updateErr.message };

  await writeAuditLog({
    workspace_id: post.workspace_id,
    actor_id: user.id,
    verb: "approved",
    target: `content_post:${postId}`,
    payload: { rationale: rationale ?? "" },
  });

  return { ok: true, post: updated as ContentPost };
}

// ---------------------------------------------------------------------------
// Request changes on a post
// ---------------------------------------------------------------------------

export async function requestChanges(
  postId: string,
  notes: string,
): Promise<WorkflowResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not configured" };
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { data: post } = await supabase
    .from("content_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();

  if (!post) return { ok: false, error: "Post not found" };
  if (post.content_status !== "in_review") {
    return { ok: false, error: "Post is not in review" };
  }

  if (post.workspace_id) {
    const { data: role } = await supabase.rpc("workspace_role", {
      p_workspace_id: post.workspace_id,
    });
    if (!role || !canApprove(role as Parameters<typeof canApprove>[0])) {
      return { ok: false, error: "Insufficient permissions" };
    }
  }

  await supabase.from("approvals").insert({
    content_post_id: postId,
    approver_id: user.id,
    status: "changes_requested",
    rationale: notes,
  });

  const { data: updated, error: updateErr } = await supabase
    .from("content_posts")
    .update({
      content_status: "changes_requested",
      review_notes: notes,
    })
    .eq("id", postId)
    .select()
    .single();

  if (updateErr) return { ok: false, error: updateErr.message };

  await writeAuditLog({
    workspace_id: post.workspace_id,
    actor_id: user.id,
    verb: "changes_requested",
    target: `content_post:${postId}`,
    payload: { notes },
  });

  return { ok: true, post: updated as ContentPost };
}

// ---------------------------------------------------------------------------
// Schedule an approved post
// ---------------------------------------------------------------------------

export async function schedulePost(
  postId: string,
  scheduledFor: string,
): Promise<WorkflowResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not configured" };
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { data: post } = await supabase
    .from("content_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();

  if (!post) return { ok: false, error: "Post not found" };
  if (post.content_status !== "approved") {
    return { ok: false, error: "Post must be approved before scheduling" };
  }

  const { data: updated, error: updateErr } = await supabase
    .from("content_posts")
    .update({
      content_status: "scheduled",
      scheduled_for: scheduledFor,
    })
    .eq("id", postId)
    .select()
    .single();

  if (updateErr) return { ok: false, error: updateErr.message };

  await writeAuditLog({
    workspace_id: post.workspace_id,
    actor_id: user.id,
    verb: "scheduled",
    target: `content_post:${postId}`,
    payload: { scheduled_for: scheduledFor },
  });

  return { ok: true, post: updated as ContentPost };
}

// ---------------------------------------------------------------------------
// Fetch content posts for a workspace with optional status filter
// ---------------------------------------------------------------------------

export async function getWorkspaceContentPosts(
  workspaceId: string,
  statusFilter?: ContentStatus[],
): Promise<ContentPost[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase
    .from("content_posts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter.length > 0) {
    query = query.in("content_status", statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[content-workflow] getWorkspaceContentPosts:", error.message);
    return [];
  }
  return (data ?? []) as ContentPost[];
}

// ---------------------------------------------------------------------------
// Fetch pending approvals for the current user
// ---------------------------------------------------------------------------

export async function getPendingApprovals(): Promise<ContentPost[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("pending_approvals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[content-workflow] getPendingApprovals:", error.message);
    return [];
  }
  return (data ?? []) as ContentPost[];
}
