import { resolveUser, isSetupMode } from "@/lib/session";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const user = await resolveUser();
  return (
    <div>
      <PageHeader
        title="Account Settings"
        description="Manage your profile, security, and preferences."
        icon="Settings"
        accent="#6366f1"
      />
      <SettingsClient user={user} setupMode={isSetupMode()} />
    </div>
  );
}
