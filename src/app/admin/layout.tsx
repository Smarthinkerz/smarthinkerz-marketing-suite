import { redirect } from "next/navigation";
import { resolveUser, isSetupMode } from "@/lib/session";
import { AdminShell } from "@/components/admin/admin-shell";

// Admin area is always session-dependent; never statically prerender.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await resolveUser();

  // Defense-in-depth: enforce admin role at the layout. Database RLS (`is_admin()`)
  // independently blocks any non-admin write even if the UI is bypassed.
  if (!isSetupMode() && user.role !== "admin") {
    redirect("/dashboard");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
