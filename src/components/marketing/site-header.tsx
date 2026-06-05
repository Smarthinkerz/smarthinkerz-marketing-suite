"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Demo", href: "/demo" },
  { label: "Contact", href: "/contact" },
];

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {signedIn ? (
            <Button href="/dashboard" size="sm">
              Dashboard
            </Button>
          ) : (
            <>
              <Button href="/auth/sign-in" variant="ghost" size="sm">
                Sign in
              </Button>
              <Button href="/auth/sign-up" size="sm">
                Get started
              </Button>
            </>
          )}
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-border bg-background md:hidden",
          open ? "max-h-96" : "max-h-0 border-t-0",
        )}
        style={{ transition: "max-height 0.25s ease" }}
      >
        <div className="space-y-1 px-4 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-2"
            >
              {item.label}
            </Link>
          ))}
          <div className="flex items-center gap-3 pt-3">
            <ThemeToggle />
            {signedIn ? (
              <Button href="/dashboard" size="sm" className="flex-1">
                Dashboard
              </Button>
            ) : (
              <>
                <Button href="/auth/sign-in" variant="outline" size="sm" className="flex-1">
                  Sign in
                </Button>
                <Button href="/auth/sign-up" size="sm" className="flex-1">
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
