import { Badge } from "@/components/ui/badge";
import type { ContentStatus } from "@/lib/org-types";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  ContentStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-surface-2 text-muted border-border",
  },
  in_review: {
    label: "In Review",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  changes_requested: {
    label: "Changes Requested",
    className: "bg-error/10 text-error border-error/20",
  },
  approved: {
    label: "Approved",
    className: "bg-success/10 text-success border-success/20",
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  published: {
    label: "Published",
    className: "bg-success/15 text-success border-success/30",
  },
  needs_attention: {
    label: "Needs Attention",
    className: "bg-error/10 text-error border-error/20",
  },
};

export function ContentStatusBadge({
  status,
  className,
}: {
  status: ContentStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <Badge
      className={cn(
        "border font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </Badge>
  );
}
