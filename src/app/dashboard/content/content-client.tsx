"use client";

import { AiToolForm, CopyButton, type FieldDef } from "@/components/dashboard/ai-tool-form";
import { Badge } from "@/components/ui/badge";
import { generateContent, type ContentResult } from "./actions";

const fields: FieldDef[] = [
  {
    name: "contentType",
    label: "Content type",
    type: "select",
    options: [
      { value: "Blog post", label: "Blog post" },
      { value: "Ad copy", label: "Ad copy" },
      { value: "Product description", label: "Product description" },
      { value: "Landing page", label: "Landing page copy" },
      { value: "Press release", label: "Press release" },
    ],
  },
  { name: "topic", label: "Topic / product", placeholder: "e.g. Eco-friendly running shoes", required: true },
  {
    name: "tone",
    label: "Tone",
    type: "select",
    options: [
      { value: "Professional", label: "Professional" },
      { value: "Friendly", label: "Friendly" },
      { value: "Persuasive", label: "Persuasive" },
      { value: "Playful", label: "Playful" },
      { value: "Luxury", label: "Luxury" },
    ],
  },
  { name: "audience", label: "Target audience", placeholder: "e.g. Health-conscious millennials" },
  { name: "keywords", label: "Keywords (optional)", placeholder: "comma, separated, keywords" },
];

export function ContentClient() {
  return (
    <AiToolForm<ContentResult>
      fields={fields}
      action={generateContent}
      submitLabel="Generate content"
      renderResult={(data) => (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-foreground">{data.title}</h3>
            <CopyButton text={`${data.title}\n\n${data.body}`} />
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{data.body}</p>

          {data.variants?.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Alternative versions
              </p>
              <div className="space-y-2">
                {data.variants.map((v, i) => (
                  <div key={i} className="rounded-xl bg-surface-2 p-3 text-sm text-foreground">
                    {v}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.hashtags.map((h) => (
                <Badge key={h} variant="accent">#{h}</Badge>
              ))}
            </div>
          )}
        </div>
      )}
    />
  );
}
