import { Resend } from "resend";
import { config } from "@/lib/config";

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Sends a transactional email through Resend. When Resend is not configured,
 * it logs and returns gracefully so flows are never blocked in development.
 */
export async function sendEmail({ to, subject, html, replyTo }: SendEmailArgs): Promise<{
  ok: boolean;
  delivered?: boolean;
  skipped?: boolean;
  error?: string;
}> {
  if (!config.resend.isConfigured) {
    console.info(`[email skipped — Resend not configured] to=${to} subject="${subject}"`);
    return { ok: true, skipped: true, delivered: false };
  }

  try {
    const resend = new Resend(config.resend.apiKey);
    await resend.emails.send({
      from: config.resend.fromEmail,
      to,
      subject,
      html,
      replyTo,
    });
    return { ok: true, delivered: true };
  } catch (err) {
    console.error("[email error]", err);
    return { ok: false, delivered: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/* ----------------------------- Templates -------------------------------- */

const BRAND = config.appName;

function shell(title: string, bodyHtml: string, cta?: { label: string; url: string }) {
  return `
  <div style="margin:0;padding:0;background:#0b0f1a;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:20px;font-weight:800;color:#ffffff;">Brain<span style="color:#818cf8;">Power</span> AI</span>
      </div>
      <div style="background:#111827;border:1px solid #1f2937;border-radius:16px;padding:32px;">
        <h1 style="margin:0 0 12px;font-size:22px;color:#f9fafb;">${title}</h1>
        <div style="font-size:15px;line-height:1.6;color:#cbd5e1;">${bodyHtml}</div>
        ${
          cta
            ? `<div style="margin-top:24px;"><a href="${cta.url}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px;">${cta.label}</a></div>`
            : ""
        }
      </div>
      <p style="text-align:center;font-size:12px;color:#64748b;margin-top:20px;">
        © ${new Date().getFullYear()} ${BRAND}. All rights reserved.
      </p>
    </div>
  </div>`;
}

export function welcomeEmail(name: string) {
  return {
    subject: `Welcome to ${BRAND}`,
    html: shell(
      `Welcome${name ? `, ${name}` : ""} 👋`,
      `<p>Your account is ready. ${BRAND} gives you ten AI-powered marketing tools in one place — content, SEO, social, email, ads, and more.</p><p>Sign in to launch your first campaign.</p>`,
      { label: "Open dashboard", url: `${config.appUrl}/dashboard` },
    ),
  };
}

export function receiptEmail(plan: string, amount: string) {
  return {
    subject: `Your ${BRAND} receipt — ${plan} plan`,
    html: shell(
      "Payment received",
      `<p>Thank you for subscribing to the <strong>${plan}</strong> plan.</p><p>Amount charged: <strong>${amount}</strong>.</p><p>Your tools are now unlocked.</p>`,
      { label: "Go to billing", url: `${config.appUrl}/dashboard/billing` },
    ),
  };
}

export function gracePeriodEmail(graceUntil: string) {
  return {
    subject: "Action needed: update your payment method",
    html: shell(
      "We couldn't process your payment",
      `<p>Your most recent payment failed. To avoid losing access, please update your billing details.</p><p>Your access continues until <strong>${graceUntil}</strong>.</p>`,
      { label: "Update billing", url: `${config.appUrl}/dashboard/billing` },
    ),
  };
}

export function churnEmail() {
  return {
    subject: "Your subscription has been canceled",
    html: shell(
      "Subscription canceled",
      `<p>Your plan has been canceled and premium tools are now locked.</p><p>You can resubscribe anytime to instantly regain access.</p>`,
      { label: "Resubscribe", url: `${config.appUrl}/pricing` },
    ),
  };
}
