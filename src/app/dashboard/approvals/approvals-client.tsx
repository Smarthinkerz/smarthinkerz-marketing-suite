"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, Clock, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContentStatusBadge } from "@/components/ui/content-status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { approvePost, requestChanges } from "./actions";
import type { ContentPost } from "@/lib/content-workflow";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
  google: "Google",
  email: "Email",
};

function PostCard({ post }: { post: ContentPost }) {
  const [expanded, setExpanded] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      const res = await approvePost(post.id);
      setResult({ ok: res.ok, message: res.ok ? "Post approved." : (res.error ?? "Error") });
    });
  }

  function handleRequestChanges() {
    if (!notes.trim()) {
      setResult({ ok: false, message: "Please enter review notes before requesting changes." });
      return;
    }
    startTransition(async () => {
      const res = await requestChanges(post.id, notes);
      setResult({ ok: res.ok, message: res.ok ? "Changes requested." : (res.error ?? "Error") });
    });
  }

  const isActioned = result?.ok === true;

  return (
    <Card className={cn("transition-opacity", isActioned && "opacity-50")}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {PLATFORM_LABELS[post.platform] ?? post.platform}
          </Badge>
          <ContentStatusBadge status={post.content_status} />
          <span className="text-xs text-muted">
            {new Date(post.created_at).toLocaleDateString()}
          </span>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="shrink-0 rounded p-1 text-muted hover:bg-surface-2 hover:text-foreground"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Post body preview */}
        <p className={cn("text-sm text-foreground", !expanded && "line-clamp-3")}>
          {post.body}
        </p>

        {/* Hashtags */}
        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.hashtags.map((h) => (
              <span key={h} className="rounded bg-surface-2 px-2 py-0.5 text-xs text-muted">
                #{h}
              </span>
            ))}
          </div>
        )}

        {/* Review notes from previous round */}
        {post.review_notes && (
          <div className="rounded-md border border-warning/20 bg-warning/5 p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-warning">
              Previous review notes
            </p>
            <p className="text-sm text-foreground">{post.review_notes}</p>
          </div>
        )}

        {/* Action result */}
        {result && (
          <div
            className={cn(
              "rounded-md px-3 py-2 text-sm",
              result.ok
                ? "bg-success/10 text-success"
                : "bg-error/10 text-error",
            )}
          >
            {result.message}
          </div>
        )}

        {/* Actions — hidden once actioned */}
        {!isActioned && (
          <div className="space-y-3 border-t border-border pt-3">
            {/* Request changes notes */}
            {showNotes && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  Review notes (required)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Describe what needs to change…"
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={isPending || showNotes}
                className="gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </Button>

              {!showNotes ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNotes(true)}
                  className="gap-1.5"
                >
                  <MessageSquare className="h-4 w-4" />
                  Request changes
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRequestChanges}
                    disabled={isPending}
                    className="gap-1.5 border-error/30 text-error hover:bg-error/10"
                  >
                    <XCircle className="h-4 w-4" />
                    Send feedback
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setShowNotes(false); setNotes(""); }}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ApprovalsClient({
  user,
  posts,
}: {
  user: SessionUser;
  posts: ContentPost[];
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals Inbox"
        description="Review and approve content before it is scheduled or published."
        icon="CheckCircle2"
      />

      {posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="mb-3 h-10 w-10 text-success" />
            <p className="text-base font-semibold text-foreground">All clear</p>
            <p className="mt-1 text-sm text-muted">
              No content posts are waiting for your review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted" />
            <span className="text-sm text-muted">
              {posts.length} post{posts.length !== 1 ? "s" : ""} awaiting review
            </span>
          </div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
