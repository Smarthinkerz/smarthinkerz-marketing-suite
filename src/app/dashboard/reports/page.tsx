import { resolveUser } from "@/lib/session";
import { getAnalyticsSummary } from "@/lib/analytics";
import { ReportsClient } from "./reports-client";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await resolveUser();
  const summary = await getAnalyticsSummary();

  return <ReportsClient user={user} summary={summary} />;
}
