import { Info } from "lucide-react";

/**
 * Non-blocking banner shown when a required integration key is missing. Keeps
 * the app explorable while making the setup requirement explicit (never fakes
 * data in production paths).
 */
export function SetupNotice({ service, hint }: { service: string; hint?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
      <div>
        <p className="font-semibold text-foreground">{service} is not configured yet</p>
        <p className="mt-0.5 text-muted">
          {hint ??
            `Add the required environment variables to enable ${service}. See .env.example and README for setup.`}
        </p>
      </div>
    </div>
  );
}
