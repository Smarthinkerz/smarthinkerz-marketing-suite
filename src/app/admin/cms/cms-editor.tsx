"use client";

import { useState, useMemo, useCallback } from "react";
import { Save, RotateCcw, History, Plus, Trash2, Eye, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Hero, Features, PricingSection, Testimonials, FinalCta } from "@/components/marketing/home-sections";
import { saveCmsContent, restoreCmsVersion, resetCmsToDefault } from "./actions";
import type { CmsContent, CmsVersion } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type Section = "hero" | "features" | "pricing" | "testimonials" | "finalCta" | "footer";
const SECTIONS: { key: Section; label: string }[] = [
  { key: "hero", label: "Hero" },
  { key: "features", label: "Features" },
  { key: "pricing", label: "Pricing" },
  { key: "testimonials", label: "Testimonials" },
  { key: "finalCta", label: "Final CTA" },
  { key: "footer", label: "Footer" },
];

export function CmsEditor({
  initial,
  versions,
  setupMode,
}: {
  initial: CmsContent;
  versions: CmsVersion[];
  setupMode: boolean;
}) {
  const [content, setContent] = useState<CmsContent>(initial);
  const [baseline, setBaseline] = useState<CmsContent>(initial);
  const [active, setActive] = useState<Section>("hero");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const dirty = useMemo(() => JSON.stringify(content) !== JSON.stringify(baseline), [content, baseline]);

  const patch = useCallback(<K extends Section>(key: K, value: Partial<CmsContent[K]>) => {
    setContent((c) => ({ ...c, [key]: { ...c[key], ...value } }));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    const res = await saveCmsContent(content);
    setSaving(false);
    if (res.ok) {
      setBaseline(content);
      setMsg({ tone: "ok", text: setupMode ? "Saved (demo, non-persistent)." : "Published to homepage." });
    } else {
      setMsg({ tone: "err", text: res.error ?? "Save failed." });
    }
  }

  async function handleRestore(id: string) {
    const res = await restoreCmsVersion(id);
    if (res.ok) {
      setShowHistory(false);
      setMsg({ tone: "ok", text: "Version restored. Reloading…" });
      setTimeout(() => window.location.reload(), 600);
    } else {
      setMsg({ tone: "err", text: res.error ?? "Restore failed." });
    }
  }

  async function handleReset() {
    setShowReset(false);
    const res = await resetCmsToDefault();
    if (res.ok) {
      setMsg({ tone: "ok", text: "Reset to default. Reloading…" });
      setTimeout(() => window.location.reload(), 600);
    } else {
      setMsg({ tone: "err", text: res.error ?? "Reset failed." });
    }
  }

  return (
    <div className="space-y-5">
      {/* Header / actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Front Page Editor</h1>
          <p className="text-sm text-muted">
            Edit homepage content with live preview.{" "}
            {dirty ? (
              <span className="font-medium text-warning">Unsaved changes</span>
            ) : (
              <span className="text-success">All changes saved</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}>
            <History className="h-4 w-4" /> History
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowReset(true)}>
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
          <Button href="/" external variant="outline" size="sm">
            <Eye className="h-4 w-4" /> View live
          </Button>
          <Button size="sm" onClick={handleSave} loading={saving} disabled={!dirty}>
            <Save className="h-4 w-4" /> {setupMode ? "Save (demo)" : "Publish"}
          </Button>
        </div>
      </div>

      {msg && (
        <div
          className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm ${
            msg.tone === "ok" ? "bg-success/10 text-success" : "bg-error/10 text-error"
          }`}
        >
          {msg.tone === "ok" ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {msg.text}
        </div>
      )}

      {setupMode && (
        <div className="rounded-md bg-warning/10 px-4 py-2.5 text-sm text-warning">
          Demo mode: edits are not persisted. Connect Supabase to publish to the live site and keep version history.
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        {/* Editor */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active === s.key ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <Card className="space-y-4">
            {active === "hero" && (
              <>
                <Field label="Eyebrow" value={content.hero.eyebrow} onChange={(v) => patch("hero", { eyebrow: v })} />
                <Field label="Headline" value={content.hero.headline} onChange={(v) => patch("hero", { headline: v })} />
                <Field label="Subheadline" value={content.hero.subheadline} onChange={(v) => patch("hero", { subheadline: v })} textarea />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Primary CTA" value={content.hero.ctaPrimary} onChange={(v) => patch("hero", { ctaPrimary: v })} />
                  <Field label="Secondary CTA" value={content.hero.ctaSecondary} onChange={(v) => patch("hero", { ctaSecondary: v })} />
                </div>
              </>
            )}

            {active === "features" && (
              <>
                <Field label="Section title" value={content.features.title} onChange={(v) => patch("features", { title: v })} />
                <Field label="Section subtitle" value={content.features.subtitle} onChange={(v) => patch("features", { subtitle: v })} textarea />
                <div className="space-y-3">
                  <Label>Feature items</Label>
                  {content.features.items.map((item, i) => (
                    <div key={i} className="rounded-xl border border-border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted">Item {i + 1}</span>
                        <button
                          onClick={() =>
                            patch("features", { items: content.features.items.filter((_, idx) => idx !== i) })
                          }
                          className="text-muted hover:text-error"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Icon (e.g. Megaphone)"
                          value={item.icon}
                          onChange={(e) => {
                            const items = [...content.features.items];
                            items[i] = { ...item, icon: e.target.value };
                            patch("features", { items });
                          }}
                        />
                        <Input
                          placeholder="Title"
                          value={item.title}
                          onChange={(e) => {
                            const items = [...content.features.items];
                            items[i] = { ...item, title: e.target.value };
                            patch("features", { items });
                          }}
                        />
                      </div>
                      <Input
                        className="mt-2"
                        placeholder="Description"
                        value={item.desc}
                        onChange={(e) => {
                          const items = [...content.features.items];
                          items[i] = { ...item, desc: e.target.value };
                          patch("features", { items });
                        }}
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      patch("features", {
                        items: [...content.features.items, { icon: "Sparkles", title: "New feature", desc: "Description" }],
                      })
                    }
                  >
                    <Plus className="h-4 w-4" /> Add feature
                  </Button>
                </div>
              </>
            )}

            {active === "pricing" && (
              <>
                <Field label="Section title" value={content.pricing.title} onChange={(v) => patch("pricing", { title: v })} />
                <Field label="Section subtitle" value={content.pricing.subtitle} onChange={(v) => patch("pricing", { subtitle: v })} textarea />
                <p className="text-xs text-muted">Plan cards are driven by your tier configuration and update automatically.</p>
              </>
            )}

            {active === "testimonials" && (
              <>
                <Field label="Section title" value={content.testimonials.title} onChange={(v) => patch("testimonials", { title: v })} />
                <Field label="Section subtitle" value={content.testimonials.subtitle} onChange={(v) => patch("testimonials", { subtitle: v })} textarea />
                <div className="space-y-3">
                  <Label>Testimonials</Label>
                  {content.testimonials.items.map((item, i) => (
                    <div key={i} className="rounded-xl border border-border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted">Quote {i + 1}</span>
                        <button
                          onClick={() =>
                            patch("testimonials", { items: content.testimonials.items.filter((_, idx) => idx !== i) })
                          }
                          className="text-muted hover:text-error"
                          aria-label="Remove testimonial"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <Textarea
                        placeholder="Quote"
                        value={item.quote}
                        onChange={(e) => {
                          const items = [...content.testimonials.items];
                          items[i] = { ...item, quote: e.target.value };
                          patch("testimonials", { items });
                        }}
                      />
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Author"
                          value={item.author}
                          onChange={(e) => {
                            const items = [...content.testimonials.items];
                            items[i] = { ...item, author: e.target.value };
                            patch("testimonials", { items });
                          }}
                        />
                        <Input
                          placeholder="Role"
                          value={item.role}
                          onChange={(e) => {
                            const items = [...content.testimonials.items];
                            items[i] = { ...item, role: e.target.value };
                            patch("testimonials", { items });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      patch("testimonials", {
                        items: [...content.testimonials.items, { quote: "Great product!", author: "New Customer", role: "Title, Company" }],
                      })
                    }
                  >
                    <Plus className="h-4 w-4" /> Add testimonial
                  </Button>
                </div>
              </>
            )}

            {active === "finalCta" && (
              <>
                <Field label="Headline" value={content.finalCta.headline} onChange={(v) => patch("finalCta", { headline: v })} />
                <Field label="Subheadline" value={content.finalCta.subheadline} onChange={(v) => patch("finalCta", { subheadline: v })} textarea />
                <Field label="Button label" value={content.finalCta.button} onChange={(v) => patch("finalCta", { button: v })} />
              </>
            )}

            {active === "footer" && (
              <>
                <Field label="Tagline" value={content.footer.tagline} onChange={(v) => patch("footer", { tagline: v })} textarea />
                <Field label="Copyright" value={content.footer.copyright} onChange={(v) => patch("footer", { copyright: v })} />
              </>
            )}
          </Card>
        </div>

        {/* Live preview */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Eye className="h-4 w-4" /> Live preview
            <Badge variant="outline">{active}</Badge>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
            <div className="max-h-[70vh] origin-top overflow-y-auto">
              {active === "hero" && <Hero hero={content.hero} />}
              {active === "features" && <Features features={content.features} />}
              {active === "pricing" && <PricingSection pricing={content.pricing} />}
              {active === "testimonials" && <Testimonials testimonials={content.testimonials} />}
              {active === "finalCta" && <FinalCta finalCta={content.finalCta} />}
              {active === "footer" && (
                <div className="p-8">
                  <p className="text-foreground">{content.footer.tagline}</p>
                  <p className="mt-3 text-sm text-muted">{content.footer.copyright}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Version history modal */}
      <Modal open={showHistory} onClose={() => setShowHistory(false)} title="Version history">
        {versions.length === 0 ? (
          <p className="text-sm text-muted">No saved versions yet. Each publish creates a restore point.</p>
        ) : (
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{v.label}</p>
                  <p className="text-xs text-muted">{formatDate(v.created_at)}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleRestore(v.id)}>
                  Restore
                </Button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Reset confirm modal */}
      <Modal open={showReset} onClose={() => setShowReset(false)} title="Reset to default?">
        <p className="text-sm text-muted">
          This replaces the current homepage content with the default template. A restore point will be created first,
          so you can undo it from version history.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowReset(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
