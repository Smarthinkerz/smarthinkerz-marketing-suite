import { resolveUser, isSetupMode } from "@/lib/session";
import { tierHasTool, minTierForTool } from "@/lib/plans";
import { TOOL_BY_KEY } from "@/lib/tools";
import { PageHeader } from "@/components/dashboard/page-header";
import { ToolGate } from "@/components/dashboard/tool-gate";
import { ContentClient } from "./content-client";

export default async function ContentPage() {
  const user = await resolveUser();
  const meta = TOOL_BY_KEY.content;

  if (!isSetupMode() && !tierHasTool(user.effectiveTier, "content")) {
    return <ToolGate toolName={meta.name} requiredTier={minTierForTool("content")} />;
  }

  return (
    <div>
      <PageHeader
        title={meta.name}
        description="Generate blog posts, ad copy, and product descriptions in seconds."
        icon={meta.icon}
        accent={meta.accent}
      />
      <ContentClient />
    </div>
  );
}
