import { Loader2 } from "lucide-react";
import { Icon } from "./icon";
import { cn } from "@/lib/utils";

export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-muted", className)}>
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon = "Inbox",
  title,
  description,
  action,
  className,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-muted">
        <Icon name={icon} className="h-7 w-7" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-error/30 bg-error/5 py-12 text-center">
      <Icon name="TriangleAlert" className="h-8 w-8 text-error" />
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
