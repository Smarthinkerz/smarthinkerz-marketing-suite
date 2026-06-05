import { resolveUser, isSetupMode } from "@/lib/session";
import { tierHasTool, minTierForTool, PLANS } from "@/lib/plans";
import { TOOL_BY_KEY } from "@/lib/tools";
import { PageHeader } from "@/components/dashboard/page-header";
import { ToolGate } from "@/components/dashboard/tool-gate";
import { listCampaigns } from "./actions";
import { CampaignsClient } from "./campaigns-client";

export default async function CampaignsPage() {
  const user = await resolveUser();
  const meta = TOOL_BY_KEY.campaigns;

  if (!isSetupMode() && !tierHasTool(user.effectiveTier, "campaigns")) {
    return <ToolGate toolName={meta.name} requiredTier={minTierForTool("campaigns")} />;
  }

  const campaigns = await listCampaigns();
  const limit = PLANS[user.effectiveTier].campaignLimit;

  return (
    <div>
      <PageHeader
        title={meta.name}
        description="Plan, launch, and track multi-channel campaigns."
        icon={meta.icon}
        accent={meta.accent}
      />
      <CampaignsClient initial={campaigns} campaignLimit={limit} setupMode={isSetupMode()} />
    </div>
  );
}
