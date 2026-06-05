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
import { Download, FileSpreadsheet } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { exportToCsv, exportToExcel } from "@/lib/export";
import type { AdminAnalytics, AdminUserRow } from "../actions";

const COLORS = ["#6366f1", "#ec4899", "#06b6d4", "#22c55e", "#f59e0b", "#8b5cf6"];

export function AdminAnalyticsClient({
  analytics,
  users,
}: {
  analytics: AdminAnalytics;
  users: AdminUserRow[];
}) {
  const { kpis } = analytics;

  const exportColumns = [
    { key: "full_name" as const, label: "Name" },
    { key: "email" as const, label: "Email" },
    { key: "role" as const, label: "Role" },
    { key: "tier" as const, label: "Plan" },
    { key: "status" as const, label: "Status" },
    { key: "created_at" as const, label: "Joined" },
  ];

  const kpiCards = [
    { label: "Total users", value: kpis.totalUsers.toLocaleString() },
    { label: "Active subscriptions", value: kpis.activeSubs.toLocaleString() },
    { label: "MRR", value: formatCurrency(kpis.mrr) },
    { label: "Annual run-rate", value: formatCurrency(kpis.mrr * 12) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted">Revenue, growth, and subscription insights.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCsv(users, exportColumns, "users-export")}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToExcel(users, exportColumns, "users-export")}>
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((k) => (
          <Card key={k.label} className="py-4">
            <p className="text-xs font-medium text-muted">{k.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{k.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Signups & revenue" subtitle="Last 6 months" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.signupTrend}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-foreground)",
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Subscription status" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.statusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {analytics.statusBreakdown.map((_, i) => (
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
            {analytics.statusBreakdown.map((s, i) => (
              <div key={s.status} className="flex items-center gap-1.5 text-xs capitalize text-muted">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {s.status} ({s.count})
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="MRR by plan" subtitle="Monthly recurring revenue per tier" />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.revenueByTier}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(148,163,184,0.1)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                }}
              />
              <Bar dataKey="mrr" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
