/**
 * Organization model types — Corporate Spec Phase 2
 * These extend the existing types.ts without modifying it.
 */

export type OrgRole = "owner" | "admin" | "manager" | "creator" | "approver" | "viewer";

export type ContentStatus =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "scheduled"
  | "published"
  | "needs_attention";

export type AuditVerb =
  | "created"
  | "updated"
  | "deleted"
  | "submitted_for_review"
  | "approved"
  | "changes_requested"
  | "scheduled"
  | "published"
  | "publish_failed"
  | "member_invited"
  | "member_removed"
  | "role_changed"
  | "workspace_created"
  | "workspace_updated"
  | "guardrails_updated"
  | "asset_uploaded"
  | "asset_deleted"
  | "sso_configured"
  | "login";

export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  plan: string;
  sso_config: Record<string, unknown> | null;
  scim_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
}

export interface Workspace {
  id: string;
  org_id: string;
  name: string;
  slug: string | null;
  auto_publish_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/** Result from the my_workspaces view */
export interface MyWorkspace extends Workspace {
  org_name: string;
  org_plan: string;
  member_role: OrgRole;
}

export interface BrandGuardrails {
  id: string;
  workspace_id: string;
  tone: string | null;
  do_phrases: string[];
  dont_phrases: string[];
  reading_level: string | null;
  approved_hashtags: string[];
  banned_terms: string[];
  platform_rules: Record<string, PlatformRule>;
  updated_at: string;
}

export interface PlatformRule {
  char_limit?: number;
  link_policy?: string;
  disclosures?: string;
}

export interface Approval {
  id: string;
  content_post_id: string;
  approver_id: string;
  status: "approved" | "changes_requested";
  rationale: string | null;
  acted_at: string;
}

export interface AuditLogEntry {
  id: number;
  org_id: string | null;
  workspace_id: string | null;
  actor_id: string | null;
  verb: AuditVerb;
  target: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface Asset {
  id: string;
  workspace_id: string;
  uploaded_by: string | null;
  type: "image" | "video" | "document" | "logo" | "other";
  name: string;
  url: string;
  size_bytes: number | null;
  mime_type: string | null;
  approved: boolean;
  tags: string[];
  created_at: string;
}

/** Role permission matrix */
export const ROLE_PERMISSIONS: Record<OrgRole, {
  generate: boolean;
  edit: boolean;
  approve: boolean;
  guardrails: boolean;
  connectAccounts: boolean;
  members: boolean;
}> = {
  owner:    { generate: true,  edit: true,  approve: true,  guardrails: true,  connectAccounts: true,  members: true  },
  admin:    { generate: true,  edit: true,  approve: true,  guardrails: true,  connectAccounts: true,  members: true  },
  manager:  { generate: true,  edit: true,  approve: true,  guardrails: true,  connectAccounts: true,  members: false },
  creator:  { generate: true,  edit: true,  approve: false, guardrails: false, connectAccounts: false, members: false },
  approver: { generate: false, edit: false, approve: true,  guardrails: false, connectAccounts: false, members: false },
  viewer:   { generate: false, edit: false, approve: false, guardrails: false, connectAccounts: false, members: false },
};

export function canApprove(role: OrgRole): boolean {
  return ROLE_PERMISSIONS[role].approve;
}

export function canEdit(role: OrgRole): boolean {
  return ROLE_PERMISSIONS[role].edit;
}

export function canManageGuardrails(role: OrgRole): boolean {
  return ROLE_PERMISSIONS[role].guardrails;
}

export function canManageMembers(role: OrgRole): boolean {
  return ROLE_PERMISSIONS[role].members;
}
