"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SetupNotice } from "@/components/setup-notice";
import { LoadingState } from "@/components/ui/states";
import type { ActionState } from "@/lib/tool-runner";

export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  help?: string;
}

interface AiToolFormProps<T> {
  fields: FieldDef[];
  action: (input: Record<string, string>) => Promise<ActionState<T>>;
  submitLabel?: string;
  renderResult: (data: T) => React.ReactNode;
  /** Optional history note rendered under the form. */
  note?: string;
}

export function AiToolForm<T>({
  fields,
  action,
  submitLabel = "Generate",
  renderResult,
  note,
}: AiToolFormProps<T>) {
  const [state, setState] = useState<ActionState<T>>({ status: "idle" });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const input: Record<string, string> = {};
    fields.forEach((f) => (input[f.name] = String(fd.get(f.name) ?? "")));
    const res = await action(input);
    setState(res);
    setLoading(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {f.label}
                {f.required && <span className="text-error"> *</span>}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  name={f.name}
                  required={f.required}
                  placeholder={f.placeholder}
                  className="min-h-[120px] w-full resize-y rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              ) : f.type === "select" ? (
                <select
                  name={f.name}
                  required={f.required}
                  defaultValue={f.options?.[0]?.value}
                  className="w-full cursor-pointer rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
                >
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name={f.name}
                  required={f.required}
                  placeholder={f.placeholder}
                  className="w-full rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              )}
              {f.help && <p className="mt-1 text-xs text-muted">{f.help}</p>}
            </div>
          ))}
          <Button type="submit" loading={loading} className="w-full">
            {!loading && <Sparkles className="h-4 w-4" />}
            {submitLabel}
          </Button>
          {note && <p className="text-center text-xs text-muted">{note}</p>}
        </form>
      </Card>

      <div>
        {loading && (
          <Card>
            <LoadingState label="Generating with AI…" />
          </Card>
        )}

        {!loading && state.status === "idle" && (
          <Card className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-7 w-7" />
            </span>
            <p className="mt-4 font-semibold text-foreground">Your results appear here</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              Fill in the form and generate AI-powered output.
            </p>
          </Card>
        )}

        {!loading && state.status === "error" && (
          <Card>
            {state.setup ? (
              <SetupNotice
                service="OpenAI"
                hint="Add your OPENAI_API_KEY to enable live AI generation. Until then, tools are visible but cannot produce results."
              />
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-error/10 p-4 text-sm text-error">{state.error}</div>
                {state.upgrade && (
                  <Button href="/dashboard/billing" className="w-full">
                    Upgrade plan
                  </Button>
                )}
              </div>
            )}
          </Card>
        )}

        {!loading && state.status === "success" && state.data != null && (
          <ResultPanel>{renderResult(state.data)}</ResultPanel>
        )}
      </div>
    </div>
  );
}

function ResultPanel({ children }: { children: React.ReactNode }) {
  return <Card className="space-y-4">{children}</Card>;
}

/** Small reusable copy-to-clipboard button for generated text blocks. */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-foreground"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export { Link };
