import { resolveUser, isSetupMode } from "@/lib/session";
import { tierHasTool, minTierForTool } from "@/lib/plans";
import { TOOL_BY_KEY } from "@/lib/tools";
import { PageHeader } from "@/components/dashboard/page-header";
import { ToolGate } from "@/components/dashboard/tool-gate";
import { EcommerceClient } from "./ecommerce-client";

export default async function EcommercePage() {
  const user = await resolveUser();
  const meta = TOOL_BY_KEY.ecommerce;

  if (!isSetupMode() && !tierHasTool(user.effectiveTier, "ecommerce")) {
    return <ToolGate toolName={meta.name} requiredTier={minTierForTool("ecommerce")} />;
  }

  return (
    <div>
      <PageHeader
        title={meta.name}
        description="Optimize product listings for higher conversion."
        icon={meta.icon}
        accent={meta.accent}
      />
      <EcommerceClient />
    </div>
  );
}
