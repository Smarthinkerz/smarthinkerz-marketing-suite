import { resolveUser, isSetupMode } from "@/lib/session";
import { tierHasTool, minTierForTool } from "@/lib/plans";
import { TOOL_BY_KEY } from "@/lib/tools";
import { PageHeader } from "@/components/dashboard/page-header";
import { ToolGate } from "@/components/dashboard/tool-gate";
import { ChatbotClient } from "./chatbot-client";

export default async function ChatbotPage() {
  const user = await resolveUser();
  const meta = TOOL_BY_KEY.chatbot;

  if (!isSetupMode() && !tierHasTool(user.effectiveTier, "chatbot")) {
    return <ToolGate toolName={meta.name} requiredTier={minTierForTool("chatbot")} />;
  }

  return (
    <div>
      <PageHeader
        title={meta.name}
        description="Configure a customer-service assistant and preview it live."
        icon={meta.icon}
        accent={meta.accent}
      />
      <ChatbotClient />
    </div>
  );
}
