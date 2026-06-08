import { Icon } from "@/components/ui/icon";

export function PageHeader({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: string;
  /** @deprecated accent gradients have been retired per corporate spec. */
  accent?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {icon && (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-surface-2 text-primary">
            <Icon name={icon} className="h-6 w-6" />
          </span>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
