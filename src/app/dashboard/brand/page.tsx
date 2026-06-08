import { resolveUser } from "@/lib/session";
import { BrandClient } from "./brand-client";
import { getBrandGuardrails } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function BrandPage() {
  const user = await resolveUser();
  const guardrails = await getBrandGuardrails();

  return <BrandClient user={user} initialGuardrails={guardrails} />;
}
