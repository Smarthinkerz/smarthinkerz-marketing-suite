import { resolveUser } from "@/lib/session";
import { PageHeader } from "@/components/dashboard/page-header";
import { AutoPromoteClient } from "./auto-promote-client";

export const dynamic = "force-dynamic";

export default async function AutoPromotePage() {
  const user = await resolveUser();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Auto-Promote"
        description="AI-generated posts are queued as drafts. Submit for review before publishing."
        icon="Zap"
      />
      <AutoPromoteClient user={user} />
    </div>
  );
}
