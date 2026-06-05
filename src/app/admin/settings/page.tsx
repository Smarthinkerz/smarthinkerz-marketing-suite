import Link from "next/link";
import {
  Database,
  Sparkles,
  CreditCard,
  Mail,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
  Globe,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { config, isProductionReady } from "@/lib/config";
import { isSetupMode } from "@/lib/session";

// Settings reflects live, env-derived configuration; never statically cache.
export const dynamic = "force-dynamic";

interface IntegrationRow {
  key: string;
  name: string;
  description: string;
  icon: typeof Database;
  configured: boolean;
  detail: string;
  required: boolean;
}

function maskUrl(url?: string): string {
  if (!url) return "Not set";
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export default function AdminSettingsPage() {
  const setup = isSetupMode();

  const integrations: IntegrationRow[] = [
    {
      key: "supabase",
      name: "Supabase",
      description: "Authentication, database, and row-level security.",
      icon: Database,
      configured: config.supabase.isConfigured,
      detail: config.supabase.isConfigured ? maskUrl(config.supabase.url) : "URL + anon key required",
      required: true,
    },
    {
      key: "openai",
      name: "OpenAI",
      description: "AI content, copy, and image generation.",
      icon: Sparkles,
      configured: config.openai.isConfigured,
      detail: config.openai.isConfigured ? `Model: ${config.openai.model}` : "API key required",
      required: false,
    },
    {
      key: "payments",
      name: "Payment Hub",
      description: "Hosted checkout and signed billing webhooks.",
      icon: CreditCard,
      configured: config.payments.isConfigured,
      detail: config.payments.isConfigured ? maskUrl(config.payments.checkoutBaseUrl) : "Checkout URL + webhook secret required",
      required: false,
    },
    {
      key: "resend",
      name: "Resend",
      description: "Transactional and notification email delivery.",
      icon: Mail,
      configured: config.resend.isConfigured,
      detail: config.resend.isConfigured ? config.resend.fromEmail : "API key required",
      required: false,
    },
  ];

  const appInfo: { label: string; value: string }[] = [
    { label: "Application name", value: config.appName },
    { label: "Application URL", value: config.appUrl },
    { label: "Environment", value: process.env.NODE_ENV ?? "unknown" },
    { label: "Mode", value: setup ? "Setup / demo" : "Connected" },
  ];

  const configuredCount = integrations.filter((i) => i.configured).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted">
          Platform configuration and integration health. Values are read from
          server environment variables and are never editable from the browser.
        </p>
      </div>

      {/* Readiness banner */}
      <Card
        className={
          isProductionReady
            ? "border-success/30 bg-success/5"
            : "border-warning/30 bg-warning/5"
        }
      >
        <div className="flex items-start gap-3">
          {isProductionReady ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">
              {isProductionReady
                ? "Production ready"
                : "Some integrations are not configured"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {configuredCount} of {integrations.length} integrations connected.{" "}
              {isProductionReady
                ? "All external services are connected."
                : "The app runs with graceful fallbacks until every service is connected."}
            </p>
          </div>
        </div>
      </Card>

      {/* Integrations */}
      <Card className="p-0">
        <div className="p-6 pb-0">
          <CardHeader
            title="Integrations"
            subtitle="Connection status for each external service."
          />
        </div>
        <div className="divide-y divide-border">
          {integrations.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.key} className="flex items-center gap-4 px-6 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{it.name}</p>
                    {it.required && (
                      <Badge variant="outline">Required</Badge>
                    )}
                  </div>
                  <p className="truncate text-sm text-muted">{it.description}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">{it.detail}</p>
                </div>
                <Badge variant={it.configured ? "success" : "warning"}>
                  {it.configured ? "Connected" : "Not configured"}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Application info */}
        <Card>
          <CardHeader title="Application" subtitle="Runtime details for this deployment." />
          <dl className="space-y-3">
            {appInfo.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4">
                <dt className="text-sm text-muted">{row.label}</dt>
                <dd className="truncate text-sm font-medium text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Security / quick links */}
        <Card>
          <CardHeader title="Security & access" subtitle="Admin-only controls." />
          <div className="space-y-2">
            <div className="flex items-start gap-3 rounded-xl border border-border p-3">
              <ShieldCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-success" />
              <div>
                <p className="text-sm font-medium text-foreground">Row-level security</p>
                <p className="text-sm text-muted">
                  Database access is enforced by Supabase RLS. The admin role is
                  required for every privileged write, independent of the UI.
                </p>
              </div>
            </div>
            <Link
              href="/admin/users"
              className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-surface-2"
            >
              <span className="text-sm font-medium text-foreground">Manage user roles</span>
              <ExternalLink className="h-4 w-4 text-muted" />
            </Link>
            <a
              href={config.supabase.url ?? "https://supabase.com/dashboard"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-surface-2"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Globe className="h-4 w-4 text-primary" /> Open Supabase project
              </span>
              <ExternalLink className="h-4 w-4 text-muted" />
            </a>
          </div>
        </Card>
      </div>

      {setup && (
        <div className="rounded-xl bg-warning/10 px-4 py-2.5 text-sm text-warning">
          Setup mode: connect Supabase (URL + anon key) to enable live data and
          authentication. Other integrations are optional and degrade gracefully.
        </div>
      )}
    </div>
  );
}
