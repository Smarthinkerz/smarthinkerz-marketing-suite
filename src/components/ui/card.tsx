import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-6 shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
  children,
  ...props
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}) {
  // Support both the legacy {title, subtitle, action} API and the new children API
  if (children !== undefined) {
    return (
      <div className={cn("flex items-start justify-between gap-4", className)} {...props}>
        {children}
      </div>
    );
  }
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-4", className)} {...props}>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-0", className)} {...props}>
      {children}
    </div>
  );
}
