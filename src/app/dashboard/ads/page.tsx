import { resolveUser, isSetupMode } from "@/lib/session";
import { tierHasTool, minTierForTool } from "@/lib/plans";
import { TOOL_BY_KEY } from "@/lib/tools";
import { PageHeader } from "@/components/dashboard/page-header";
import { ToolGate } from "@/components/dashboard/tool-gate";
import { AdsClient } from "./ads-client";

export default async function AdsPage() {
  const user = await resolveUser();
  const meta = TOOL_BY_KEY.ads;

  if (!isSetupMode() && !tierHasTool(user.effectiveTier, "ads")) {
    return <ToolGate toolName={meta.name} requiredTier={minTierForTool("ads")} />;
  }

  return (
    <div>
      <PageHeader
        title={meta.name}
        description="AI-optimized ad creative, targeting, and budget plans."
        icon={meta.icon}
      />
      <AdsClient />
    </div>
  );
}
