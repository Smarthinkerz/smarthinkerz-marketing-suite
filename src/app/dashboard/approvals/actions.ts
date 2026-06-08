"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/workspace";
import { canApprove } from "@/lib/org-types";

export interface WorkflowResult {
  ok: boolean;
  error?: string;
}

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

  if (post.workspace_id) {
    const { data: role } = await supabase.rpc("workspace_role", {
      p_workspace_id: post.workspace_id,
    });
    if (!role || !canApprove(role as Parameters<typeof canApprove>[0])) {
      return { ok: false, error: "Insufficient permissions to approve" };
    }
  }

  await supabase.from("approvals").insert({
    content_post_id: postId,
    approver_id: user.id,
    status: "approved",
    rationale: rationale ?? null,
  });

  const { error: updateErr } = await supabase
    .from("content_posts")
    .update({
      content_status: "approved",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", postId);
  if (updateErr) return { ok: false, error: updateErr.message };

  await writeAuditLog({
    workspace_id: post.workspace_id,
    actor_id: user.id,
    verb: "approved",
    target: `content_post:${postId}`,
    payload: { rationale: rationale ?? "" },
  });
  return { ok: true };
}

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

  const { error: updateErr } = await supabase
    .from("content_posts")
    .update({
      content_status: "changes_requested",
      review_notes: notes,
    })
    .eq("id", postId);
  if (updateErr) return { ok: false, error: updateErr.message };

  await writeAuditLog({
    workspace_id: post.workspace_id,
    actor_id: user.id,
    verb: "changes_requested",
    target: `content_post:${postId}`,
    payload: { notes },
  });
  return { ok: true };
}
