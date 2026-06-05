"use client";

import { Target, TrendingUp, Wallet } from "lucide-react";
import { AiToolForm, CopyButton, type FieldDef } from "@/components/dashboard/ai-tool-form";
import { Badge } from "@/components/ui/badge";
import { generateAds, type AdResult } from "./actions";

const fields: FieldDef[] = [
  {
    name: "platform",
    label: "Ad platform",
    type: "select",
    options: [
      { value: "Meta (Facebook/Instagram)", label: "Meta (Facebook/Instagram)" },
      { value: "Google Ads", label: "Google Ads" },
      { value: "TikTok", label: "TikTok" },
      { value: "LinkedIn", label: "LinkedIn" },
      { value: "X (Twitter)", label: "X (Twitter)" },
    ],
  },
  { name: "product", label: "Product / offer", placeholder: "e.g. AI marketing suite — 14-day free trial", required: true },
  { name: "audience", label: "Target audience", placeholder: "e.g. SMB owners, 25-45, e-commerce" },
  {
    name: "objective",
    label: "Objective",
    type: "select",
    options: [
      { value: "Conversions", label: "Conversions" },
      { value: "Lead generation", label: "Lead generation" },
      { value: "Traffic", label: "Traffic" },
      { value: "Brand awareness", label: "Brand awareness" },
    ],
  },
];

export function AdsClient() {
  return (
    <AiToolForm<AdResult>
      fields={fields}
      action={generateAds}
      submitLabel="Generate ad campaign"
      renderResult={(data) => (
        <div className="space-y-5">
          <Badge variant="primary">{data.platform}</Badge>

          <div className="space-y-3">
            {data.variants?.map((v, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-foreground">{v.headline}</p>
                  <CopyButton text={`${v.headline}\n\n${v.primaryText}\n\n${v.description}`} />
                </div>
                <p className="mt-2 text-sm text-foreground">{v.primaryText}</p>
                <p className="mt-1 text-xs text-muted">{v.description}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
              <Target className="h-4 w-4 text-primary" /> Targeting
            </p>
            <div className="flex flex-wrap gap-2">
              {data.targeting?.map((t) => (
                <Badge key={t} variant="outline">{t}</Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-2 p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                <Wallet className="h-4 w-4" /> Budget tip
              </p>
              <p className="mt-1 text-sm text-foreground">{data.budgetTip}</p>
            </div>
            <div className="rounded-xl bg-surface-2 p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                <TrendingUp className="h-4 w-4" /> Est. CTR
              </p>
              <p className="mt-1 text-sm text-foreground">{data.estimatedCtr}</p>
            </div>
          </div>
        </div>
      )}
    />
  );
}
