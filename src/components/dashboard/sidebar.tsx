"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Icon } from "@/components/ui/icon";
import { TOOLS } from "@/lib/tools";
import { PLANS, tierHasTool, type Tier } from "@/lib/plans";
import { cn } from "@/lib/utils";

interface SidebarProps {
  tier: Tier;
  role: "subscriber" | "admin";
  onNavigate?: () => void;
}

const PRIMARY = [
  { href: "/dashboard", label: "My Work", icon: "LayoutDashboard" },
];

const WORKFLOW = [
  { href: "/dashboard/approvals", label: "Approvals Inbox", icon: "CheckCircle2" },
  { href: "/dashboard/auto-promote", label: "Content Queue", icon: "Zap" },
];

const BRAND_LINKS = [
  { href: "/dashboard/brand", label: "Brand Guardrails", icon: "Shield" },
  { href: "/dashboard/brand/assets", label: "Asset Library", icon: "FolderOpen" },
];

const REPORTING = [
  { href: "/dashboard/reports", label: "Reports", icon: "BarChart2" },
];

const ACCOUNT = [
  { href: "/dashboard/billing", label: "Billing & Plan", icon: "CreditCard" },
  { href: "/dashboard/settings", label: "Settings", icon: "Settings" },
];

export function Sidebar({ tier, role, onNavigate }: SidebarProps) {
  const pathname = usePathname() ?? "";

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
      active
        ? "bg-primary/10 text-primary"
        : "text-muted hover:bg-surface-2 hover:text-foreground",
    );

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      <div className="px-2 pt-2">
        <Logo />
      </div>

      <nav className="flex flex-col gap-1">
        {PRIMARY.map((item) => (
          <Link key={item.href} href={item.href} onClick={onNavigate} className={linkClass(isActive(item.href))}>
            <Icon name={item.icon} className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div>
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Workflow
        </p>
        <nav className="flex flex-col gap-1">
          {WORKFLOW.map((item) => (
            <Link key={item.href} href={item.href} onClick={onNavigate} className={linkClass(isActive(item.href))}>
              <Icon name={item.icon} className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div>
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Marketing Tools
        </p>
        <nav className="flex flex-col gap-1">
          {TOOLS.map((tool) => {
            const unlocked = tierHasTool(tier, tool.key);
            const active = isActive(tool.href);
            return (
              <Link
                key={tool.key}
                href={tool.href}
                onClick={onNavigate}
                className={cn(linkClass(active), !unlocked && "opacity-60")}
              >
                <Icon name={tool.icon} className="h-5 w-5" />
                <span className="flex-1">{tool.name}</span>
                {!unlocked && <Lock className="h-3.5 w-3.5 text-muted" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div>
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Brand
        </p>
        <nav className="flex flex-col gap-1">
          {BRAND_LINKS.map((item) => (
            <Link key={item.href} href={item.href} onClick={onNavigate} className={linkClass(isActive(item.href))}>
              <Icon name={item.icon} className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div>
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Reporting
        </p>
        <nav className="flex flex-col gap-1">
          {REPORTING.map((item) => (
            <Link key={item.href} href={item.href} onClick={onNavigate} className={linkClass(isActive(item.href))}>
              <Icon name={item.icon} className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Account
        </p>
        <nav className="flex flex-col gap-1">
          {ACCOUNT.map((item) => (
            <Link key={item.href} href={item.href} onClick={onNavigate} className={linkClass(isActive(item.href))}>
              <Icon name={item.icon} className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
          {role === "admin" && (
            <Link href="/admin" onClick={onNavigate} className={linkClass(pathname.startsWith("/admin"))}>
              <Icon name="ShieldCheck" className="h-5 w-5" />
              Admin Panel
            </Link>
          )}
        </nav>

        <div className="mt-4 rounded-lg border border-border bg-surface-2 p-4">
          <p className="text-xs font-medium text-muted">Current plan</p>
          <p className="text-sm font-bold text-foreground">{PLANS[tier].name}</p>
          {tier !== "enterprise" && (
            <Link
              href="/dashboard/billing"
              onClick={onNavigate}
              className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
            >
              Upgrade plan →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
