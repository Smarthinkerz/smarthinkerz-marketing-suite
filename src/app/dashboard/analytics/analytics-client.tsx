"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { AnalyticsData } from "./actions";

const COLORS = ["#6366f1", "#ec4899", "#06b6d4", "#22c55e", "#f59e0b", "#8b5cf6"];

export function AnalyticsClient({ data }: { data: AnalyticsData }) {
  if (data.totals.impressions === 0) {
    return (
      <EmptyState
        icon="BarChart3"
        title="No analytics yet"
        description="Create and run campaigns to see performance analytics here."
      />
    );
  }

  const kpis = [
    { label: "Total spend", value: formatCurrency(data.totals.spend) },
    { label: "Impressions", value: formatNumber(data.totals.impressions) },
    { label: "Avg. CTR", value: `${data.ctr.toFixed(2)}%` },
    { label: "Conv. rate", value: `${data.convRate.toFixed(2)}%` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="py-4">
            <p className="text-xs font-medium text-muted">{k.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{k.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 font-semibold text-foreground">Clicks & conversions (14 days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id="clicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="conv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-foreground)",
                  }}
                />
                <Area type="monotone" dataKey="clicks" stroke="#6366f1" fill="url(#clicks)" strokeWidth={2} />
                <Area type="monotone" dataKey="conversions" stroke="#ec4899" fill="url(#conv)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold text-foreground">Conversions by channel</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.channelBreakdown}
                  dataKey="conversions"
                  nameKey="channel"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {data.channelBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            {data.channelBreakdown.map((c, i) => (
              <div key={c.channel} className="flex items-center gap-1.5 text-xs text-muted">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {c.channel}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="mb-4 font-semibold text-foreground">Campaign performance</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.campaignPerformance}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(148,163,184,0.1)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                }}
              />
              <Bar dataKey="conversions" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
