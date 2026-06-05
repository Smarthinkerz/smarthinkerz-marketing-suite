"use client";

import { useMemo, useState } from "react";
import { Plus, Megaphone, Trash2, Play, Pause } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Label } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/states";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Campaign, Channel } from "@/lib/types";
import { createCampaign, updateCampaignStatus, deleteCampaign } from "./actions";

const CHANNELS: { value: Channel; label: string }[] = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "google", label: "Google" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "X (Twitter)" },
  { value: "email", label: "Email" },
];

const statusVariant: Record<string, "success" | "warning" | "default" | "primary"> = {
  active: "success",
  paused: "warning",
  draft: "default",
  completed: "primary",
};

export function CampaignsClient({
  initial,
  campaignLimit,
  setupMode,
}: {
  initial: Campaign[];
  campaignLimit: number | null;
  setupMode: boolean;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initial);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Channel[]>(["facebook"]);

  const totals = useMemo(() => {
    return campaigns.reduce(
      (acc, c) => {
        acc.spend += c.spend;
        acc.impressions += c.impressions;
        acc.clicks += c.clicks;
        acc.conversions += c.conversions;
        return acc;
      },
      { spend: 0, impressions: 0, clicks: 0, conversions: 0 },
    );
  }, [campaigns]);

  const atLimit = campaignLimit !== null && campaigns.length >= campaignLimit;

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await createCampaign({
      name: String(fd.get("name") ?? ""),
      channels: selected,
      budget: Number(fd.get("budget") ?? 0),
      status: String(fd.get("status") ?? "draft"),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Could not create campaign.");
      return;
    }
    setOpen(false);
    // Optimistic: reload to fetch persisted row.
    window.location.reload();
  }

  async function toggleStatus(c: Campaign) {
    const next = c.status === "active" ? "paused" : "active";
    setCampaigns((list) => list.map((x) => (x.id === c.id ? { ...x, status: next } : x)));
    const res = await updateCampaignStatus(c.id, next);
    if (!res.ok) {
      setCampaigns((list) => list.map((x) => (x.id === c.id ? { ...x, status: c.status } : x)));
      setError(res.error ?? null);
    }
  }

  async function remove(c: Campaign) {
    if (!confirm(`Delete campaign "${c.name}"?`)) return;
    const prev = campaigns;
    setCampaigns((list) => list.filter((x) => x.id !== c.id));
    const res = await deleteCampaign(c.id);
    if (!res.ok) {
      setCampaigns(prev);
      setError(res.error ?? null);
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total spend", value: formatCurrency(totals.spend) },
          { label: "Impressions", value: formatNumber(totals.impressions) },
          { label: "Clicks", value: formatNumber(totals.clicks) },
          { label: "Conversions", value: formatNumber(totals.conversions) },
        ].map((kpi) => (
          <Card key={kpi.label} className="py-4">
            <p className="text-xs font-medium text-muted">{kpi.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {campaigns.length} campaign{campaigns.length !== 1 && "s"}
          {campaignLimit !== null && ` · limit ${campaignLimit}/mo`}
        </p>
        <Button onClick={() => setOpen(true)} disabled={atLimit} size="sm">
          <Plus className="h-4 w-4" /> New campaign
        </Button>
      </div>

      {error && (
        <div className="rounded-xl bg-warning/10 px-4 py-2.5 text-sm text-warning">{error}</div>
      )}

      {campaigns.length === 0 ? (
        <EmptyState
          icon="Megaphone"
          title="No campaigns yet"
          description="Create your first multi-channel campaign to start tracking performance."
          action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New campaign</Button>}
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Spend</th>
                <th className="px-4 py-3">CTR</th>
                <th className="px-4 py-3">Conv.</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const ctr = c.impressions ? ((c.clicks / c.impressions) * 100).toFixed(2) : "0.00";
                return (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Megaphone className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-medium text-foreground">{c.name}</p>
                          <p className="text-xs text-muted">{c.channels.join(", ")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[c.status] ?? "default"}>{c.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-foreground">{formatCurrency(c.budget)}</td>
                    <td className="px-4 py-3 text-foreground">{formatCurrency(c.spend)}</td>
                    <td className="px-4 py-3 text-foreground">{ctr}%</td>
                    <td className="px-4 py-3 text-foreground">{formatNumber(c.conversions)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleStatus(c)}
                          className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-foreground"
                          aria-label="Toggle status"
                        >
                          {c.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => remove(c)}
                          className="rounded-lg p-1.5 text-muted hover:bg-error/10 hover:text-error"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New campaign" description="Set up a multi-channel campaign.">
        <form onSubmit={onCreate} className="space-y-4">
          <div>
            <Label htmlFor="name">Campaign name</Label>
            <Input id="name" name="name" required placeholder="e.g. Holiday Promo 2026" />
          </div>
          <div>
            <Label>Channels</Label>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((ch) => {
                const active = selected.includes(ch.value);
                return (
                  <button
                    type="button"
                    key={ch.value}
                    onClick={() =>
                      setSelected((s) =>
                        active ? s.filter((x) => x !== ch.value) : [...s, ch.value],
                      )
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted hover:bg-surface-2"
                    }`}
                  >
                    {ch.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="budget">Budget (USD)</Label>
              <Input id="budget" name="budget" type="number" min="0" defaultValue={1000} />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue="draft">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </Select>
            </div>
          </div>
          {setupMode && (
            <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
              Demo mode: connect Supabase to persist campaigns.
            </p>
          )}
          <Button type="submit" loading={busy} className="w-full">
            Create campaign
          </Button>
        </form>
      </Modal>
    </div>
  );
}
