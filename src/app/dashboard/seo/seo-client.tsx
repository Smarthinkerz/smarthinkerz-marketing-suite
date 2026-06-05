"use client";

import { AiToolForm, CopyButton, type FieldDef } from "@/components/dashboard/ai-tool-form";
import { Badge } from "@/components/ui/badge";
import { generateSeo, type SeoResult } from "./actions";

const fields: FieldDef[] = [
  { name: "topic", label: "Seed topic or URL", placeholder: "e.g. project management software", required: true },
  { name: "region", label: "Target market (optional)", placeholder: "e.g. United States" },
];

const diffVariant: Record<string, "success" | "warning" | "error"> = {
  Low: "success",
  Medium: "warning",
  High: "error",
};

export function SeoClient() {
  return (
    <AiToolForm<SeoResult>
      fields={fields}
      action={generateSeo}
      submitLabel="Analyze keywords"
      renderResult={(data) => (
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Primary keywords
            </p>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs uppercase text-muted">
                  <tr>
                    <th className="px-3 py-2">Keyword</th>
                    <th className="px-3 py-2">Intent</th>
                    <th className="px-3 py-2">Difficulty</th>
                  </tr>
                </thead>
                <tbody>
                  {data.primaryKeywords?.map((k) => (
                    <tr key={k.keyword} className="border-t border-border">
                      <td className="px-3 py-2 font-medium text-foreground">{k.keyword}</td>
                      <td className="px-3 py-2 text-muted">{k.intent}</td>
                      <td className="px-3 py-2">
                        <Badge variant={diffVariant[k.difficulty] ?? "default"}>{k.difficulty}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Long-tail opportunities
            </p>
            <div className="flex flex-wrap gap-2">
              {data.longTail?.map((k) => (
                <Badge key={k} variant="outline">{k}</Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Content ideas
            </p>
            <ul className="space-y-1.5 text-sm text-foreground">
              {data.contentIdeas?.map((idea) => (
                <li key={idea} className="flex gap-2">
                  <span className="text-primary">•</span> {idea}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-surface-2 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Meta tags</p>
              <CopyButton text={`${data.metaTitle}\n${data.metaDescription}`} />
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">{data.metaTitle}</p>
            <p className="mt-1 text-sm text-muted">{data.metaDescription}</p>
          </div>
        </div>
      )}
    />
  );
}
