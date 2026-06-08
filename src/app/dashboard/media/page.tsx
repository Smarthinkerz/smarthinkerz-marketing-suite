import { resolveUser, isSetupMode } from "@/lib/session";
import { tierHasTool, minTierForTool } from "@/lib/plans";
import { TOOL_BY_KEY } from "@/lib/tools";
import { PageHeader } from "@/components/dashboard/page-header";
import { ToolGate } from "@/components/dashboard/tool-gate";
import { MediaClient } from "./media-client";

export default async function MediaPage() {
  const user = await resolveUser();
  const meta = TOOL_BY_KEY.media;

  if (!isSetupMode() && !tierHasTool(user.effectiveTier, "media")) {
    return <ToolGate toolName={meta.name} requiredTier={minTierForTool("media")} />;
  }

  return (
    <div>
      <PageHeader
        title={meta.name}
        description="Generate marketing images and visuals with AI."
        icon={meta.icon}
      />
      <MediaClient />
    </div>
  );
}
