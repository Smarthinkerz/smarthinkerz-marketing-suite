import { resolveUser, isSetupMode } from "@/lib/session";
import { tierHasTool, minTierForTool } from "@/lib/plans";
import { TOOL_BY_KEY } from "@/lib/tools";
import { PageHeader } from "@/components/dashboard/page-header";
import { ToolGate } from "@/components/dashboard/tool-gate";
import { EmailClient } from "./email-client";

export default async function EmailPage() {
  const user = await resolveUser();
  const meta = TOOL_BY_KEY.email;

  if (!isSetupMode() && !tierHasTool(user.effectiveTier, "email")) {
    return <ToolGate toolName={meta.name} requiredTier={minTierForTool("email")} />;
  }

  return (
    <div>
      <PageHeader
        title={meta.name}
        description="Subject lines, preheaders, and email copy that convert."
        icon={meta.icon}
      />
      <EmailClient />
    </div>
  );
}
