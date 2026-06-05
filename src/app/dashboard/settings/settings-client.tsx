"use client";

import { useState } from "react";
import { User, Lock, Palette, LogOut, Check } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import { PLANS } from "@/lib/plans";
import type { SessionUser } from "@/lib/types";
import { signOutAction } from "@/app/auth/actions";
import { updateProfile, updatePassword } from "./actions";

function Notice({ tone, children }: { tone: "ok" | "err"; children: React.ReactNode }) {
  return (
    <p className={`flex items-center gap-1.5 text-sm ${tone === "ok" ? "text-success" : "text-error"}`}>
      {tone === "ok" && <Check className="h-4 w-4" />}
      {children}
    </p>
  );
}

export function SettingsClient({ user, setupMode }: { user: SessionUser; setupMode: boolean }) {
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user.fullName ?? "");
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const [pw, setPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const plan = PLANS[user.tier];

  async function saveName() {
    setSavingName(true);
    setNameMsg(null);
    const res = await updateProfile({ fullName: name });
    setSavingName(false);
    setNameMsg(res.ok ? { tone: "ok", text: "Profile updated." } : { tone: "err", text: res.error ?? "Failed." });
  }

  async function savePw() {
    setSavingPw(true);
    setPwMsg(null);
    const res = await updatePassword({ password: pw });
    setSavingPw(false);
    if (res.ok) {
      setPw("");
      setPwMsg({ tone: "ok", text: "Password changed." });
    } else {
      setPwMsg({ tone: "err", text: res.error ?? "Failed." });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Profile */}
      <Card>
        <CardHeader title={<span className="flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Profile</span>} />
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled />
          </div>
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {nameMsg && <Notice tone={nameMsg.tone}>{nameMsg.text}</Notice>}
          <Button onClick={saveName} loading={savingName} size="sm">Save changes</Button>
        </div>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader title={<span className="flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> Security</span>} />
        <div className="space-y-4">
          <div>
            <Label htmlFor="pw">New password</Label>
            <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" />
          </div>
          {pwMsg && <Notice tone={pwMsg.tone}>{pwMsg.text}</Notice>}
          <Button onClick={savePw} loading={savingPw} disabled={!pw} size="sm">Update password</Button>
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader title={<span className="flex items-center gap-2"><Palette className="h-4 w-4 text-primary" /> Appearance</span>} />
        <div className="flex gap-3">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium capitalize transition-colors ${
                theme === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted hover:bg-surface-2"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </Card>

      {/* Plan + sign out */}
      <Card>
        <CardHeader title="Plan & session" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Current plan</p>
            <p className="flex items-center gap-2 text-lg font-semibold text-foreground">
              {plan.name} <Badge variant="primary">{user.status}</Badge>
            </p>
          </div>
          <Button href="/dashboard/billing" variant="outline" size="sm">Manage</Button>
        </div>
        <div className="mt-5 border-t border-border pt-4">
          <Button onClick={() => signOutAction()} variant="danger" size="sm">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
        {setupMode && (
          <p className="mt-3 text-xs text-muted">Demo mode: connect Supabase to persist account changes.</p>
        )}
      </Card>
    </div>
  );
}
