"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserMenu } from "./user-menu";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DashboardShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[280px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen border-r border-border bg-surface lg:block">
        <Sidebar tier={user.effectiveTier} role={user.role} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[280px] border-r border-border bg-surface">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 z-10 rounded-full p-2 text-muted hover:bg-surface-2"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar tier={user.effectiveTier} role={user.role} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-8">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className={cn("rounded-lg p-2 text-foreground hover:bg-surface-2 lg:hidden")}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserMenu user={user} />
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
