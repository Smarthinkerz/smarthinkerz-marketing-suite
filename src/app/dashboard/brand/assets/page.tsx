import { resolveUser } from "@/lib/session";
import { getAssets } from "@/lib/assets";
import { AssetsClient } from "./assets-client";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const user = await resolveUser();
  const assets = await getAssets();

  return <AssetsClient user={user} initialAssets={assets} />;
}
