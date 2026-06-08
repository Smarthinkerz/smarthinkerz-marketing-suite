"use client";

import { useState, useTransition } from "react";
import {
  Shield,
  Plus,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { saveBrandGuardrails } from "./actions";
import { DEFAULT_GUARDRAILS } from "@/lib/brand-types";
import type { BrandGuardrails, PlatformRule } from "@/lib/brand-types";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tag input
// ---------------------------------------------------------------------------

function TagInput({
  label,
  description,
  tags,
  onChange,
  placeholder,
  variant = "default",
}: {
  label: string;
  description?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  variant?: "default" | "danger";
}) {
  const [input, setInput] = useState("");

  function add() {
    const val = input.trim();
    if (!val || tags.includes(val)) return;
    onChange([...tags, val]);
    setInput("");
  }

  function remove(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium",
              variant === "danger"
                ? "bg-error/10 text-error"
                : "bg-surface-2 text-foreground",
            )}
          >
            {tag}
            <button
              onClick={() => remove(tag)}
              className="ml-0.5 rounded hover:opacity-70"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder ?? "Type and press Enter"}
          className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <Button size="sm" variant="outline" onClick={add} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Platform rule card
// ---------------------------------------------------------------------------

function PlatformRuleCard({
  rule,
  onChange,
}: {
  rule: PlatformRule;
  onChange: (updated: PlatformRule) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const PLATFORM_LABELS: Record<string, string> = {
    linkedin: "LinkedIn",
    instagram: "Instagram",
    twitter: "X / Twitter",
    facebook: "Facebook",
    google: "Google Ads",
    email: "Email",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {PLATFORM_LABELS[rule.platform] ?? rule.platform}
          </Badge>
          {rule.max_length && (
            <span className="text-xs text-muted">{rule.max_length} chars max</span>
          )}
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="rounded p-1 text-muted hover:bg-surface-2 hover:text-foreground"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4 border-t border-border pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Max character length
              </label>
              <input
                type="number"
                value={rule.max_length ?? ""}
                onChange={(e) =>
                  onChange({ ...rule, max_length: e.target.value ? Number(e.target.value) : null })
                }
                className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Hashtag limit
              </label>
              <input
                type="number"
                value={rule.hashtag_limit ?? ""}
                onChange={(e) =>
                  onChange({
                    ...rule,
                    hashtag_limit: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">
              Tone notes
            </label>
            <textarea
              value={rule.tone_notes}
              onChange={(e) => onChange({ ...rule, tone_notes: e.target.value })}
              rows={2}
              className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main client
// ---------------------------------------------------------------------------

type Tab = "voice" | "hashtags" | "banned" | "platforms";

const TABS: { id: Tab; label: string }[] = [
  { id: "voice", label: "Voice & Tone" },
  { id: "hashtags", label: "Hashtags" },
  { id: "banned", label: "Banned Terms" },
  { id: "platforms", label: "Platform Rules" },
];

export function BrandClient({
  user,
  initialGuardrails,
}: {
  user: SessionUser;
  initialGuardrails: BrandGuardrails | null;
}) {
  const defaults = DEFAULT_GUARDRAILS;
  const [activeTab, setActiveTab] = useState<Tab>("voice");
  const [isPending, startTransition] = useTransition();
  const [saveResult, setSaveResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Form state — initialise from DB or defaults
  const [voicePillars, setVoicePillars] = useState<string[]>(
    initialGuardrails?.voice_pillars ?? defaults.voice_pillars,
  );
  const [bannedTerms, setBannedTerms] = useState<string[]>(
    initialGuardrails?.banned_terms ?? defaults.banned_terms,
  );
  const [requiredHashtags, setRequiredHashtags] = useState<string[]>(
    initialGuardrails?.required_hashtags ?? defaults.required_hashtags,
  );
  const [optionalHashtags, setOptionalHashtags] = useState<string[]>(
    initialGuardrails?.optional_hashtags ?? defaults.optional_hashtags,
  );
  const [platformRules, setPlatformRules] = useState<PlatformRule[]>(
    initialGuardrails?.platform_rules ?? defaults.platform_rules,
  );

  function handleSave() {
    startTransition(async () => {
      const workspaceId = initialGuardrails?.workspace_id ?? "default";
      const res = await saveBrandGuardrails({
        workspace_id: workspaceId,
        voice_pillars: voicePillars,
        banned_terms: bannedTerms,
        required_hashtags: requiredHashtags,
        optional_hashtags: optionalHashtags,
        platform_rules: platformRules,
      });
      setSaveResult({
        ok: res.ok,
        message: res.ok ? "Brand guardrails saved." : (res.error ?? "Save failed"),
      });
      setTimeout(() => setSaveResult(null), 4000);
    });
  }

  function updatePlatformRule(index: number, updated: PlatformRule) {
    setPlatformRules((prev) => prev.map((r, i) => (i === index ? updated : r)));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Brand Guardrails"
          description="Define your brand voice, approved hashtags, banned terms, and per-platform rules. These guardrails are enforced across all AI-generated content."
          icon="Shield"
        />
        <Button onClick={handleSave} disabled={isPending} loading={isPending} className="shrink-0 gap-1.5">
          <Save className="h-4 w-4" />
          Save guardrails
        </Button>
      </div>

      {/* Save result */}
      {saveResult && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-3 text-sm",
            saveResult.ok
              ? "bg-success/10 text-success"
              : "bg-error/10 text-error",
          )}
        >
          {saveResult.ok ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {saveResult.message}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 rounded-md border border-border bg-surface-2 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <Card>
        <CardContent className="p-6">
          {activeTab === "voice" && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-1 text-sm font-semibold text-foreground">Voice Pillars</h3>
                <p className="mb-4 text-xs text-muted">
                  Core attributes that define how your brand communicates. AI-generated content will
                  be written to reflect these pillars.
                </p>
                <TagInput
                  label="Brand voice pillars"
                  description="Add 3–6 adjectives or phrases that describe your brand voice."
                  tags={voicePillars}
                  onChange={setVoicePillars}
                  placeholder="e.g. Professional, Bold, Empowering"
                />
              </div>
              <div className="rounded-md border border-border bg-surface-2 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  Current voice pillars
                </p>
                <div className="flex flex-wrap gap-2">
                  {voicePillars.length === 0 ? (
                    <p className="text-sm text-muted">No pillars defined yet.</p>
                  ) : (
                    voicePillars.map((p) => (
                      <Badge key={p} variant="outline" className="text-xs">
                        {p}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "hashtags" && (
            <div className="space-y-6">
              <TagInput
                label="Required hashtags"
                description="These hashtags will always be appended to generated posts."
                tags={requiredHashtags}
                onChange={setRequiredHashtags}
                placeholder="e.g. brandname (without #)"
              />
              <div className="border-t border-border pt-6">
                <TagInput
                  label="Optional hashtag pool"
                  description="AI will select relevant hashtags from this pool when generating content."
                  tags={optionalHashtags}
                  onChange={setOptionalHashtags}
                  placeholder="e.g. marketing, AI, growth"
                />
              </div>
            </div>
          )}

          {activeTab === "banned" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-md border border-warning/20 bg-warning/5 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <p className="text-sm text-muted">
                  AI-generated content will avoid these terms. Content containing banned terms will
                  be flagged during review.
                </p>
              </div>
              <TagInput
                label="Banned terms"
                description="Words or phrases that must never appear in generated content."
                tags={bannedTerms}
                onChange={setBannedTerms}
                placeholder="e.g. cheap, guaranteed results"
                variant="danger"
              />
            </div>
          )}

          {activeTab === "platforms" && (
            <div className="space-y-4">
              <p className="text-sm text-muted">
                Configure per-platform constraints. These rules are applied when generating or
                reviewing content for each channel.
              </p>
              {platformRules.map((rule, i) => (
                <PlatformRuleCard
                  key={rule.platform}
                  rule={rule}
                  onChange={(updated) => updatePlatformRule(i, updated)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
