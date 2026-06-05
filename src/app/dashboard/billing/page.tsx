import { resolveUser } from "@/lib/session";
import { PageHeader } from "@/components/dashboard/page-header";
import { getBillingData } from "./actions";
import { BillingClient } from "./billing-client";
import { isCheckoutConfigured } from "@/lib/billing";

export default async function BillingPage() {
  const user = await resolveUser();
  const data = await getBillingData(user.id);

  return (
    <div>
      <PageHeader
        title="Billing & Plan"
        description="Manage your subscription, usage, and invoices."
        icon="CreditCard"
        accent="#6366f1"
      />
      <BillingClient
        user={user}
        invoices={data.invoices}
        usage={data.usage}
        checkoutConfigured={isCheckoutConfigured()}
      />
    </div>
  );
}
