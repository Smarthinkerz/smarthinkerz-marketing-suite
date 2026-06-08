"use client";

import { useState, useTransition } from "react";
import { Zap, Send, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContentStatusBadge } from "@/components/ui/content-status-badge";
import { submitForReview } from "./actions";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

// Demo draft posts for setup/demo mode
const DEMO_DRAFTS = [
  {
    id: "demo-1",
    platform: "linkedin",
    body: "Excited to share our latest insights on AI-driven marketing automation. Our platform helps teams move faster without sacrificing brand consistency. Read the full case study →",
    hashtags: ["marketing", "AI", "automation"],
    content_status: "draft" as const,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "demo-2",
    platform: "instagram",
    body: "Behind every great campaign is a team that trusts its tools. 🚀 Here's how we helped a leading e-commerce brand triple their social engagement in 30 days.",
    hashtags: ["ecommerce", "socialmedia", "growth"],
    content_status: "draft" as const,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "demo-3",
    platform: "twitter",
    body: "Content without strategy is just noise. Content with strategy is a competitive advantage. Which one are you building?",
    hashtags: ["contentmarketing", "strategy"],
    content_status: "in_review" as const,
    created_at: new Date(Date.now() - 10800000).toISOString(),
  },
];

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
  google: "Google",
  email: "Email",
};

function DraftCard({
  post,
  onSubmit,
}: {
  post: (typeof DEMO_DRAFTS)[0];
  onSubmit: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    startTransition(async () => {
      await onSubmit(post.id);
      setSubmitted(true);
    });
  }

  const isDraft = post.content_status === "draft";
  const isInReview = post.content_status === "in_review";

  return (
    <Card className={cn(submitted && "opacity-60")}>
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
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed text-foreground">{post.body}</p>
        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.hashtags.map((h) => (
              <span key={h} className="rounded bg-surface-2 px-2 py-0.5 text-xs text-muted">
                #{h}
              </span>
            ))}
          </div>
        )}
        {isDraft && !submitted && (
          <div className="border-t border-border pt-3">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isPending}
              loading={isPending}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              Submit for review
            </Button>
          </div>
        )}
        {(isInReview || submitted) && (
          <div className="flex items-center gap-2 border-t border-border pt-3 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" />
            Awaiting approval
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AutoPromoteClient({ user }: { user: SessionUser }) {
  const [drafts, setDrafts] = useState(DEMO_DRAFTS);

  async function handleSubmit(postId: string) {
    // In live mode, call the server action
    if (postId.startsWith("demo-")) {
      // Demo mode: just update local state
      setDrafts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, content_status: "in_review" as const } : p,
        ),
      );
      return;
    }
    await submitForReview(postId);
  }

  const draftCount = drafts.filter((d) => d.content_status === "draft").length;
  const reviewCount = drafts.filter((d) => d.content_status === "in_review").length;

  return (
    <div className="space-y-6">
      {/* Approval gate notice */}
      <div className="flex items-start gap-3 rounded-md border border-warning/20 bg-warning/5 p-4">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <div>
          <p className="text-sm font-medium text-foreground">Approval required before publishing</p>
          <p className="mt-0.5 text-sm text-muted">
            AI-generated posts are saved as drafts. Submit them for review — an approver must
            approve each post before it can be scheduled or published.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Drafts</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{draftCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">In Review</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{reviewCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Total</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{drafts.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Draft queue */}
      {drafts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Zap className="mb-3 h-10 w-10 text-muted" />
            <p className="text-base font-semibold text-foreground">Queue is empty</p>
            <p className="mt-1 text-sm text-muted">
              Generated posts will appear here as drafts ready for review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {drafts.map((post) => (
            <DraftCard key={post.id} post={post} onSubmit={handleSubmit} />
          ))}
        </div>
      )}
    </div>
  );
}
