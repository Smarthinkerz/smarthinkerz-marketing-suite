import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { DEMO_USER } from "@/lib/session";
import { getMyWorkspaces } from "@/lib/workspace";
import { DashboardShell } from "@/components/dashboard/shell";
import type { MyWorkspace } from "@/lib/org-types";

// Authenticated app: always render per-request (session-dependent, never cached).
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In setup mode (no Supabase) we render a demo session so the UI is fully
  // explorable. With Supabase configured, unauthenticated users are redirected.
  let user = DEMO_USER;
  let workspaces: MyWorkspace[] = [];

  if (config.supabase.isConfigured) {
    const real = await getSessionUser();
    if (!real) redirect("/auth/sign-in?redirect=/dashboard");
    user = real;
    workspaces = await getMyWorkspaces();
  }

  return (
    <DashboardShell user={user} workspaces={workspaces}>
      {children}
    </DashboardShell>
  );
}
