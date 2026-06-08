"use client";

import { useState } from "react";
import { Shield, ExternalLink, Copy, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={handleCopy}
      className="rounded p-1 text-muted hover:bg-surface-2 hover:text-foreground"
      title="Copy"
    >
      {copied ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function StepCard({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(step === 1);
  return (
    <Card>
      <CardHeader
        className="flex cursor-pointer flex-row items-center justify-between py-4"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {step}
          </span>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted" />
        )}
      </CardHeader>
      {expanded && (
        <CardContent className="border-t border-border pt-4">{children}</CardContent>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SsoClient() {
  const supabaseProjectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split(".")?.[0]?.replace(
    "https://",
    "",
  ) ?? "<your-project-ref>";

  const acsUrl = `https://${supabaseProjectRef}.supabase.co/auth/v1/sso/saml/acs`;
  const entityId = `https://${supabaseProjectRef}.supabase.co/auth/v1/sso/saml/metadata`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-2 text-primary">
          <Shield className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-foreground">SSO Configuration</h1>
          <p className="mt-1 text-sm text-muted">
            Configure SAML 2.0 Single Sign-On for your organisation using Supabase Auth.
          </p>
        </div>
      </div>

      {/* Status banner */}
      <div className="flex items-start gap-3 rounded-md border border-warning/20 bg-warning/5 p-4">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <div>
          <p className="text-sm font-medium text-foreground">
            SSO requires Supabase Pro plan or higher
          </p>
          <p className="mt-0.5 text-sm text-muted">
            SAML 2.0 SSO is available on Supabase Pro and Enterprise plans. Upgrade your Supabase
            project before proceeding.{" "}
            <a
              href="https://supabase.com/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              View plans <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </div>

      {/* Supabase values */}
      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-sm font-semibold text-foreground">Your Supabase SAML endpoints</h2>
          <p className="text-xs text-muted">
            Provide these values to your Identity Provider (IdP) when configuring the SAML
            application.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              ACS URL (Assertion Consumer Service)
            </label>
            <div className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2">
              <code className="flex-1 text-xs text-foreground">{acsUrl}</code>
              <CopyButton text={acsUrl} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Entity ID / Audience URI
            </label>
            <div className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2">
              <code className="flex-1 text-xs text-foreground">{entityId}</code>
              <CopyButton text={entityId} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-step guide */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Setup guide</h2>

        <StepCard step={1} title="Enable SAML in Supabase Dashboard">
          <ol className="space-y-2 text-sm text-muted">
            <li>1. Open your Supabase project dashboard.</li>
            <li>2. Navigate to <strong className="text-foreground">Authentication → Providers → SAML 2.0</strong>.</li>
            <li>3. Enable SAML 2.0 and save.</li>
          </ol>
          <a
            href="https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Supabase SAML docs <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </StepCard>

        <StepCard step={2} title="Configure your Identity Provider">
          <p className="text-sm text-muted">
            In your IdP (Okta, Azure AD, Google Workspace, etc.), create a new SAML application
            and provide:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li>
              <strong className="text-foreground">ACS URL:</strong> the endpoint above
            </li>
            <li>
              <strong className="text-foreground">Entity ID:</strong> the metadata URL above
            </li>
            <li>
              <strong className="text-foreground">Name ID format:</strong> Email Address
            </li>
            <li>
              <strong className="text-foreground">Attribute mapping:</strong>{" "}
              <code className="rounded bg-surface-2 px-1 text-xs">email</code> →{" "}
              <code className="rounded bg-surface-2 px-1 text-xs">user.email</code>
            </li>
          </ul>
        </StepCard>

        <StepCard step={3} title="Add the IdP metadata to Supabase">
          <p className="text-sm text-muted">
            Download the SAML metadata XML from your IdP and upload it in the Supabase dashboard
            under{" "}
            <strong className="text-foreground">
              Authentication → Providers → SAML 2.0 → Add provider
            </strong>
            .
          </p>
          <p className="mt-2 text-sm text-muted">
            Alternatively, provide the IdP metadata URL directly if your IdP supports it.
          </p>
        </StepCard>

        <StepCard step={4} title="Map domains to your IdP">
          <p className="text-sm text-muted">
            In Supabase, add the email domain(s) for your organisation (e.g.{" "}
            <code className="rounded bg-surface-2 px-1 text-xs">yourcompany.com</code>). Users
            signing in with those domains will be redirected to your IdP automatically.
          </p>
        </StepCard>

        <StepCard step={5} title="Test and go live">
          <p className="text-sm text-muted">
            Use an incognito window to sign in with a corporate email address. You should be
            redirected to your IdP login page and returned to the dashboard after authentication.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Supabase handles token exchange
            </Badge>
            <Badge variant="outline" className="text-xs">
              No custom SAML code required
            </Badge>
          </div>
        </StepCard>
      </div>

      {/* Supported IdPs */}
      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-sm font-semibold text-foreground">Supported Identity Providers</h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              "Okta",
              "Azure Active Directory",
              "Google Workspace",
              "OneLogin",
              "JumpCloud",
              "Ping Identity",
              "Auth0",
              "Any SAML 2.0 IdP",
            ].map((idp) => (
              <Badge key={idp} variant="outline" className="text-xs">
                {idp}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
