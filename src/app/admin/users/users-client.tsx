"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, Download, FileSpreadsheet, ShieldCheck, User as UserIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { exportToCsv, exportToExcel } from "@/lib/export";
import { PLAN_LIST, TIER_ORDER, type Tier } from "@/lib/plans";
import type { Role } from "@/lib/types";
import { setUserRole, setUserTier, type AdminUserRow } from "../actions";

const statusVariant: Record<string, "success" | "warning" | "error" | "default"> = {
  active: "success",
  trialing: "success",
  past_due: "warning",
  canceled: "error",
};

export function UsersClient({ users, setupMode }: { users: AdminUserRow[]; setupMode: boolean }) {
  const [rows, setRows] = useState(users);
  const [q, setQ] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return rows.filter((u) => {
      const matchesQ =
        !q ||
        u.email.toLowerCase().includes(q.toLowerCase()) ||
        (u.full_name ?? "").toLowerCase().includes(q.toLowerCase());
      const matchesTier = tierFilter === "all" || u.tier === tierFilter;
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      return matchesQ && matchesTier && matchesStatus;
    });
  }, [rows, q, tierFilter, statusFilter]);

  const columns = [
    { key: "full_name" as const, label: "Name" },
    { key: "email" as const, label: "Email" },
    { key: "role" as const, label: "Role" },
    { key: "tier" as const, label: "Plan" },
    { key: "status" as const, label: "Status" },
    { key: "created_at" as const, label: "Joined" },
  ];

  function changeRole(id: string, role: Role) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, role } : r)));
    startTransition(async () => {
      const res = await setUserRole(id, role);
      if (!res.ok) setMsg(res.error ?? "Failed to update role.");
    });
  }

  function changeTier(id: string, tier: Tier) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, tier } : r)));
    startTransition(async () => {
      const res = await setUserTier(id, tier);
      if (!res.ok) setMsg(res.error ?? "Failed to update plan.");
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted">{rows.length} total · manage roles and plans.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCsv(filtered, columns, "users")}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToExcel(filtered, columns, "users")}>
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      {(msg || setupMode) && (
        <div className="rounded-xl bg-warning/10 px-4 py-2.5 text-sm text-warning">
          {msg ?? "Demo mode: editing roles/plans requires a connected Supabase backend."}
        </div>
      )}

      <Card className="p-0">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              className="pl-9"
              placeholder="Search name or email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="sm:w-40">
            <option value="all">All plans</option>
            {TIER_ORDER.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-40">
            <option value="all">All statuses</option>
            {["active", "trialing", "past_due", "canceled"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-border text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{u.full_name ?? "—"}</p>
                    <p className="text-xs text-muted">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value as Role)}
                      className="h-9 w-36 py-1"
                    >
                      <option value="subscriber">Subscriber</option>
                      <option value="admin">Admin</option>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={u.tier}
                      onChange={(e) => changeTier(u.id, e.target.value as Tier)}
                      className="h-9 w-36 py-1"
                    >
                      {PLAN_LIST.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[u.status] ?? "default"}>{u.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(u.created_at)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">
                    No users match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-success" /> Admin
        </span>
        <span className="flex items-center gap-1.5">
          <UserIcon className="h-3.5 w-3.5" /> Subscriber
        </span>
      </div>
    </div>
  );
}
