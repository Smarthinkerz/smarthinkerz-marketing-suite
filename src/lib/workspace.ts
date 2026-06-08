/**
 * Workspace & organization data access — server-side only.
 * All queries run through the Supabase server client (RLS enforced).
 */
import { createClient } from "@/lib/supabase/server";
import type { MyWorkspace, Workspace, Organization, Membership, OrgRole } from "@/lib/org-types";

// ---------------------------------------------------------------------------
// Workspace resolution
// ---------------------------------------------------------------------------

/**
 * Returns all workspaces the current user belongs to (via my_workspaces view).
 * Returns [] in setup mode (no Supabase configured).
 */
export async function getMyWorkspaces(): Promise<MyWorkspace[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("my_workspaces")
    .select("*")
    .order("org_name")
    .order("name");
  if (error) {
    console.error("[workspace] getMyWorkspaces:", error.message);
    return [];
  }
  return (data ?? []) as MyWorkspace[];
}

/**
 * Returns a single workspace by ID, enforcing RLS membership check.
 */
export async function getWorkspace(workspaceId: string): Promise<Workspace | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();
  return data as Workspace | null;
}

/**
 * Returns the current user's role in a given workspace.
 * Returns null if not a member.
 */
export async function getWorkspaceRole(workspaceId: string): Promise<OrgRole | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .rpc("workspace_role", { p_workspace_id: workspaceId });
  return (data as OrgRole | null) ?? null;
}

// ---------------------------------------------------------------------------
// Organization management
// ---------------------------------------------------------------------------

export async function getOrganization(orgId: string): Promise<Organization | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .maybeSingle();
  return data as Organization | null;
}

export async function getOrgMembers(orgId: string): Promise<(Membership & { email: string; full_name: string | null })[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  // Join memberships with profiles for display
  const { data } = await supabase
    .from("memberships")
    .select("*, profiles(email, full_name)")
    .eq("org_id", orgId)
    .order("invited_at");
  if (!data) return [];
  return data.map((m: Record<string, unknown>) => {
    const profile = m.profiles as { email: string; full_name: string | null } | null;
    return {
      ...(m as unknown as Membership),
      email: profile?.email ?? "",
      full_name: profile?.full_name ?? null,
    };
  });
}

// ---------------------------------------------------------------------------
// Workspace creation
// ---------------------------------------------------------------------------

export async function createWorkspace(
  orgId: string,
  name: string,
): Promise<Workspace | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const { data, error } = await supabase
    .from("workspaces")
    .insert({ org_id: orgId, name, slug })
    .select()
    .single();
  if (error) {
    console.error("[workspace] createWorkspace:", error.message);
    return null;
  }
  return data as Workspace;
}

// ---------------------------------------------------------------------------
// Audit log helper
// ---------------------------------------------------------------------------

export async function writeAuditLog(entry: {
  org_id?: string;
  workspace_id?: string;
  actor_id?: string;
  verb: string;
  target?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await createClient();
  if (!supabase) return;
  await supabase.from("audit_log").insert({
    org_id: entry.org_id ?? null,
    workspace_id: entry.workspace_id ?? null,
    actor_id: entry.actor_id ?? null,
    verb: entry.verb,
    target: entry.target ?? null,
    payload: entry.payload ?? {},
  });
}
