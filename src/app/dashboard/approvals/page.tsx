import { resolveUser } from "@/lib/session";
import { getPendingApprovals } from "@/lib/content-workflow";
import { ApprovalsClient } from "./approvals-client";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const [user, posts] = await Promise.all([
    resolveUser(),
    getPendingApprovals(),
  ]);

  return <ApprovalsClient user={user} posts={posts} />;
}
