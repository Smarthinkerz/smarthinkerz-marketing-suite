"use client";

import { AiToolForm, CopyButton, type FieldDef } from "@/components/dashboard/ai-tool-form";
import { generateEmail, type EmailResult } from "./actions";

const fields: FieldDef[] = [
  {
    name: "goal",
    label: "Email goal",
    type: "select",
    options: [
      { value: "Promote a product/offer", label: "Promote a product/offer" },
      { value: "Newsletter", label: "Newsletter" },
      { value: "Welcome / onboarding", label: "Welcome / onboarding" },
      { value: "Re-engagement", label: "Re-engagement" },
      { value: "Event invitation", label: "Event invitation" },
    ],
  },
  { name: "product", label: "Product / offer", placeholder: "e.g. 30% off annual plans", required: true },
  { name: "audience", label: "Audience", placeholder: "e.g. Existing free users" },
  {
    name: "tone",
    label: "Tone",
    type: "select",
    options: [
      { value: "Friendly", label: "Friendly" },
      { value: "Urgent", label: "Urgent" },
      { value: "Professional", label: "Professional" },
      { value: "Exciting", label: "Exciting" },
    ],
  },
];

export function EmailClient() {
  return (
    <AiToolForm<EmailResult>
      fields={fields}
      action={generateEmail}
      submitLabel="Write email"
      renderResult={(data) => (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Subject line options (A/B)
            </p>
            <div className="space-y-2">
              {data.subjectLines?.map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm text-foreground">
                  <span>{s}</span>
                  <CopyButton text={s} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="text-xs text-muted">Preheader</p>
            <p className="mt-1 text-sm font-medium text-foreground">{data.preheader}</p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Email body</p>
              <CopyButton text={data.body} />
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{data.body}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full gradient-brand px-5 py-2 text-sm font-semibold text-white">
              {data.cta}
            </span>
            <span className="text-xs text-muted">← suggested CTA button</span>
          </div>
        </div>
      )}
    />
  );
}
