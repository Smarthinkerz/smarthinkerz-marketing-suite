import { resolveUser, isSetupMode } from "@/lib/session";
import { tierHasTool, minTierForTool } from "@/lib/plans";
import { TOOL_BY_KEY } from "@/lib/tools";
import { PageHeader } from "@/components/dashboard/page-header";
import { ToolGate } from "@/components/dashboard/tool-gate";
import { SeoClient } from "./seo-client";

export default async function SeoPage() {
  const user = await resolveUser();
  const meta = TOOL_BY_KEY.seo;

  if (!isSetupMode() && !tierHasTool(user.effectiveTier, "seo")) {
    return <ToolGate toolName={meta.name} requiredTier={minTierForTool("seo")} />;
  }

  return (
    <div>
      <PageHeader
        title={meta.name}
        description="Keyword research, content ideas, and meta tags powered by AI."
        icon={meta.icon}
      />
      <SeoClient />
    </div>
  );
}
