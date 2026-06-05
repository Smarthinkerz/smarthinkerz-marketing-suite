# Payment Hub Integration — SmarThinkerz Marketing Suite

SmarThinkerz Marketing Suite does **not** integrate any card processor directly and never
handles card data. Payments are delegated to an external, hosted **Payment
Hub** that renders checkout, charges the customer, and notifies this app with a
**signed webhook**. This document is the contract to hand to whoever operates
the hub.

---

## 1. Overview of the flow

```
Customer clicks "Subscribe"  ──▶  Hosted checkout on the Payment Hub
                                        │  (customer pays)
                                        ▼
        SmarThinkerz Marketing Suite  ◀── signed webhook (HMAC-SHA256) ──  Payment Hub
                │
                ▼
   Verify signature → check idempotency → activate / grace / revoke plan
                │
                ▼
        Transactional email (receipt / grace notice / cancellation)
```

- The app builds outbound checkout links (see `src/lib/billing.ts`).
- The hub posts webhook events to the app (see
  `src/app/api/webhooks/payment-hub/route.ts` and `src/lib/payment-hub.ts`).

---

## 2. Plans

Register these four plans in the hub. The `plan` slug must be sent back in
webhook payloads so the app can map the purchase to the correct tier.

| Plan slug | Tier | Monthly (USD) | Yearly (USD) |
|-----------|------|---------------|--------------|
| `smarthinkerz-basic` | Basic | 29 | 290 |
| `smarthinkerz-pro` | Pro | 79 | 790 |
| `smarthinkerz-business` | Business | 149 | 1490 |
| `smarthinkerz-enterprise` | Enterprise | 299 | 2990 |

---

## 3. Outbound checkout links

The app sends customers to the hosted checkout URL configured via
`NEXT_PUBLIC_PAYMENT_HUB_CHECKOUT_URL`, with query parameters:

```
{CHECKOUT_URL}?plan={slug}&cycle={monthly|yearly}&external_ref={user_id}
```

- `plan` — one of the slugs above.
- `cycle` — `monthly` or `yearly`.
- `external_ref` — the app's user id, when available, so the hub can echo it
  back for precise account matching.

After payment, the hub may redirect the buyer to
`NEXT_PUBLIC_PAYMENT_HUB_RETURN_URL` (e.g.
`https://your-domain.com/dashboard/billing?status=success`).

---

## 4. Webhook endpoint

```
POST https://YOUR-DOMAIN/api/webhooks/payment-hub
Content-Type: application/json
{signature header}: sha256=<hex HMAC>
```

The route runs on the Node runtime and reads the **raw request body** for
signature verification.

### Health probe

```
GET https://YOUR-DOMAIN/api/webhooks/payment-hub
→ { "ok": true, "configured": true, "endpoint": "payment-hub" }
```

`configured` is `true` only when both the webhook secret and checkout URL are
set.

---

## 5. Signature scheme

- Algorithm: **HMAC-SHA256** over the **raw, unmodified** request body.
- Key: the shared secret `PAYMENT_HUB_WEBHOOK_SECRET` (identical on both sides).
- Encoding: lowercase hex. An optional `sha256=` prefix is accepted and
  stripped.
- The app compares using a **constant-time** comparison and rejects mismatched
  lengths.

Accepted signature headers (first match wins):

1. `x-paymenthub-signature` (preferred)
2. `x-signature`
3. `x-hub-signature-256`

### Reference: computing the signature

```js
const crypto = require("node:crypto");
const signature = crypto
  .createHmac("sha256", PAYMENT_HUB_WEBHOOK_SECRET)
  .update(rawBody, "utf8")
  .digest("hex");
// send header: x-paymenthub-signature: sha256=<signature>
```

---

## 6. Event payloads

All events share this envelope:

```json
{
  "event_id": "evt_unique_id",
  "type": "payment.success | payment.failed | subscription.cancelled | subscription.updated",
  "data": {
    "email": "customer@example.com",
    "user_id": "uuid-if-known",
    "external_ref": "uuid-echoed-from-checkout",
    "plan": "smarthinkerz-pro",
    "cycle": "monthly",
    "order_id": "ord_123",
    "charge_id": "chg_123",
    "amount": 79,
    "currency": "USD",
    "grace_until": "2026-01-01T00:00:00.000Z",
    "period_end": "2026-02-01T00:00:00.000Z"
  }
}
```

- **`event_id`** is required and must be globally unique — the app stores it and
  ignores duplicates, so retries are safe.
- User resolution order: `user_id` → `external_ref` → `email`.
- Fields not provided fall back to sensible defaults (e.g., period end is
  derived from `cycle`; grace defaults to 3 days).

### Event behavior

| `type` | Effect in SmarThinkerz Marketing Suite |
|--------|--------------------------|
| `payment.success` | Activate the plan (status `active`), set period end, record an invoice, send a **receipt** email. |
| `subscription.updated` | Re-activate/adjust the plan silently (no email). |
| `payment.failed` | Move subscription to `past_due`, start the grace window, send a **grace-period** email. |
| `subscription.cancelled` | Set status `canceled`, clear grace, send a **cancellation** email. Access drops to free after grace. |

---

## 7. Responses & retries

| HTTP | Meaning | Hub should |
|------|---------|------------|
| `200` | Processed (or duplicate/ignored — all safe) | Mark delivered |
| `400` | Invalid JSON body | Fix payload; do not blindly retry |
| `401` | Missing/invalid signature | Fix secret/signing; retry |
| `503` | Webhook secret not configured on the app | Retry later |
| `500` | Transient processing error | Retry with backoff (idempotency protects against double-processing) |

---

## 8. End-to-end test

With `PAYMENT_HUB_WEBHOOK_SECRET` set on the running app:

```bash
SECRET="your-shared-secret"
BODY='{"event_id":"evt_test_1","type":"payment.success","data":{"email":"you@example.com","plan":"smarthinkerz-pro","cycle":"monthly","amount":79,"currency":"USD","charge_id":"chg_test"}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

curl -i -X POST https://YOUR-DOMAIN/api/webhooks/payment-hub \
  -H "Content-Type: application/json" \
  -H "x-paymenthub-signature: sha256=$SIG" \
  --data "$BODY"
```

Expected: `200 { "ok": true, "status": "processed", "detail": "activated:pro" }`
once the user exists. Re-sending the same `event_id` returns
`{ "status": "duplicate" }`.

A request with no/incorrect signature returns `401`, confirming verification is
active.
