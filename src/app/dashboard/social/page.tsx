import { resolveUser, isSetupMode } from "@/lib/session";
import { tierHasTool, minTierForTool } from "@/lib/plans";
import { TOOL_BY_KEY } from "@/lib/tools";
import { PageHeader } from "@/components/dashboard/page-header";
import { ToolGate } from "@/components/dashboard/tool-gate";
import { SocialClient } from "./social-client";

export default async function SocialPage() {
  const user = await resolveUser();
  const meta = TOOL_BY_KEY.social;

  if (!isSetupMode() && !tierHasTool(user.effectiveTier, "social")) {
    return <ToolGate toolName={meta.name} requiredTier={minTierForTool("social")} />;
  }

  return (
    <div>
      <PageHeader
        title={meta.name}
        description="Generate platform-optimized captions and hashtags."
        icon={meta.icon}
        accent={meta.accent}
      />
      <SocialClient />
    </div>
  );
}
