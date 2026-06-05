"use client";

import { AiToolForm, CopyButton, type FieldDef } from "@/components/dashboard/ai-tool-form";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { generateSocial, type SocialResult } from "./actions";

const fields: FieldDef[] = [
  { name: "topic", label: "What are you posting about?", type: "textarea", placeholder: "e.g. Launch of our summer collection with 20% off", required: true },
  { name: "platforms", label: "Platforms", placeholder: "e.g. Instagram, LinkedIn, X, Facebook" },
  {
    name: "tone",
    label: "Tone",
    type: "select",
    options: [
      { value: "Engaging", label: "Engaging" },
      { value: "Professional", label: "Professional" },
      { value: "Witty", label: "Witty" },
      { value: "Inspirational", label: "Inspirational" },
    ],
  },
];

export function SocialClient() {
  return (
    <AiToolForm<SocialResult>
      fields={fields}
      action={generateSocial}
      submitLabel="Generate posts"
      renderResult={(data) => (
        <div className="space-y-4">
          {data.posts?.map((post, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface-2 p-4">
              <div className="flex items-center justify-between">
                <Badge variant="primary">{post.platform}</Badge>
                <CopyButton text={`${post.caption}\n\n${post.hashtags.map((h) => `#${h}`).join(" ")}`} />
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{post.caption}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {post.hashtags?.map((h) => (
                  <span key={h} className="text-xs font-medium text-accent">#{h}</span>
                ))}
              </div>
              {post.bestTime && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                  <Clock className="h-3.5 w-3.5" /> Best time: {post.bestTime}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    />
  );
}
