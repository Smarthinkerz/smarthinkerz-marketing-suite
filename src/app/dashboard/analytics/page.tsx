import { resolveUser, isSetupMode } from "@/lib/session";
import { tierHasTool, minTierForTool } from "@/lib/plans";
import { TOOL_BY_KEY } from "@/lib/tools";
import { PageHeader } from "@/components/dashboard/page-header";
import { ToolGate } from "@/components/dashboard/tool-gate";
import { getAnalytics } from "./actions";
import { AnalyticsClient } from "./analytics-client";

export default async function AnalyticsPage() {
  const user = await resolveUser();
  const meta = TOOL_BY_KEY.analytics;

  if (!isSetupMode() && !tierHasTool(user.effectiveTier, "analytics")) {
    return <ToolGate toolName={meta.name} requiredTier={minTierForTool("analytics")} />;
  }

  const data = await getAnalytics();

  return (
    <div>
      <PageHeader
        title={meta.name}
        description="Unified performance across all your campaigns and channels."
        icon={meta.icon}
        accent={meta.accent}
      />
      <AnalyticsClient data={data} />
    </div>
  );
}
