import Link from "next/link";
import { Users, DollarSign, TrendingDown, Activity, FileEdit, BarChart3, ArrowRight } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminAnalytics, getAdminUsers } from "./actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { isSetupMode } from "@/lib/session";

export default async function AdminOverviewPage() {
  const [analytics, users] = await Promise.all([getAdminAnalytics(), getAdminUsers()]);
  const { kpis } = analytics;
  const recent = users.slice(0, 6);

  const stats = [
    { label: "Total users", value: kpis.totalUsers.toLocaleString(), icon: Users, tone: "text-primary" },
    { label: "Active subscriptions", value: kpis.activeSubs.toLocaleString(), icon: Activity, tone: "text-success" },
    { label: "MRR", value: formatCurrency(kpis.mrr), icon: DollarSign, tone: "text-accent" },
    { label: "Churn rate", value: `${kpis.churnRate}%`, icon: TrendingDown, tone: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Overview</h1>
        <p className="text-sm text-muted">Platform health, revenue, and recent activity.</p>
      </div>

      {isSetupMode() && (
        <div className="rounded-xl bg-warning/10 px-4 py-2.5 text-sm text-warning">
          Demo mode: showing representative sample data. Connect Supabase to see live platform metrics.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">{s.label}</span>
                <Icon className={`h-5 w-5 ${s.tone}`} />
              </div>
              <p className="mt-3 text-3xl font-bold text-foreground">{s.value}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue by plan" subtitle="Monthly recurring revenue per tier" />
          <div className="space-y-3">
            {analytics.revenueByTier.map((r) => {
              const max = Math.max(...analytics.revenueByTier.map((x) => x.mrr), 1);
              const pct = Math.round((r.mrr / max) * 100);
              return (
                <div key={r.tier}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{r.name}</span>
                    <span className="text-muted">
                      {r.subscribers} subs · {formatCurrency(r.mrr)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full gradient-brand" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Quick actions" />
          <div className="space-y-2">
            <Link href="/admin/cms" className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-surface-2">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileEdit className="h-4 w-4 text-primary" /> Edit front page
              </span>
              <ArrowRight className="h-4 w-4 text-muted" />
            </Link>
            <Link href="/admin/analytics" className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-surface-2">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <BarChart3 className="h-4 w-4 text-accent" /> View analytics
              </span>
              <ArrowRight className="h-4 w-4 text-muted" />
            </Link>
            <Link href="/admin/users" className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-surface-2">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Users className="h-4 w-4 text-success" /> Manage users
              </span>
              <ArrowRight className="h-4 w-4 text-muted" />
            </Link>
          </div>
        </Card>
      </div>

      <Card className="p-0">
        <div className="p-6 pb-0">
          <CardHeader title="Recent users" subtitle="Newest signups across the platform" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-border text-xs uppercase text-muted">
              <tr>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-3">
                    <p className="font-medium text-foreground">{u.full_name ?? "—"}</p>
                    <p className="text-xs text-muted">{u.email}</p>
                  </td>
                  <td className="px-6 py-3 capitalize text-foreground">{u.tier}</td>
                  <td className="px-6 py-3">
                    <Badge variant={u.status === "active" || u.status === "trialing" ? "success" : u.status === "past_due" ? "warning" : "default"}>
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-muted">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
