"use client";

import { CheckCircle2, Lightbulb } from "lucide-react";
import { AiToolForm, CopyButton, type FieldDef } from "@/components/dashboard/ai-tool-form";
import { Badge } from "@/components/ui/badge";
import { optimizeListing, type EcommerceResult } from "./actions";

const fields: FieldDef[] = [
  { name: "productName", label: "Product name", placeholder: "e.g. Stainless steel insulated water bottle", required: true },
  { name: "features", label: "Key features & details", type: "textarea", placeholder: "Capacity, materials, benefits, dimensions…", required: true },
  {
    name: "platform",
    label: "Marketplace",
    type: "select",
    options: [
      { value: "Amazon", label: "Amazon" },
      { value: "Shopify", label: "Shopify" },
      { value: "Etsy", label: "Etsy" },
      { value: "eBay", label: "eBay" },
      { value: "Generic", label: "Generic / own store" },
    ],
  },
];

export function EcommerceClient() {
  return (
    <AiToolForm<EcommerceResult>
      fields={fields}
      action={optimizeListing}
      submitLabel="Optimize listing"
      renderResult={(data) => (
        <div className="space-y-5">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Optimized title</p>
              <CopyButton text={data.optimizedTitle} />
            </div>
            <p className="text-sm font-semibold text-foreground">{data.optimizedTitle}</p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Bullet points</p>
            <ul className="space-y-1.5">
              {data.bulletPoints?.map((b) => (
                <li key={b} className="flex gap-2 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {b}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Description</p>
              <CopyButton text={data.description} />
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{data.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {data.keywords?.map((k) => (
              <Badge key={k} variant="outline">{k}</Badge>
            ))}
          </div>

          {data.improvements?.length > 0 && (
            <div className="rounded-xl bg-surface-2 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                <Lightbulb className="h-4 w-4 text-warning" /> Recommendations
              </p>
              <ul className="space-y-1.5 text-sm text-foreground">
                {data.improvements.map((imp) => (
                  <li key={imp} className="flex gap-2">
                    <span className="text-primary">•</span> {imp}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    />
  );
}
