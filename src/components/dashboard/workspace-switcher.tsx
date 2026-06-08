"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Building2, Check, Plus } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import type { MyWorkspace } from "@/lib/org-types";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  owner:    "Owner",
  admin:    "Admin",
  manager:  "Manager",
  creator:  "Creator",
  approver: "Approver",
  viewer:   "Viewer",
};

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Group workspaces by org
  const grouped = workspaces.reduce<Record<string, MyWorkspace[]>>((acc, ws) => {
    const key = ws.org_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ws);
    return acc;
  }, {});

  if (workspaces.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-muted">
        <Building2 className="h-4 w-4" />
        <span>No workspace</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Building2 className="h-4 w-4 text-muted" />
        <span className="max-w-[140px] truncate">
          {activeWorkspace?.name ?? "Select workspace"}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-72 rounded-lg border border-border bg-surface shadow-lg">
          <div className="max-h-72 overflow-y-auto p-1">
            {Object.entries(grouped).map(([orgName, wsList]) => (
              <div key={orgName}>
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                  {orgName}
                </p>
                {wsList.map((ws) => {
                  const isActive = ws.id === activeWorkspace?.id;
                  return (
                    <button
                      key={ws.id}
                      role="option"
                      aria-selected={isActive}
                      onClick={() => {
                        setActiveWorkspace(ws);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-surface-2",
                      )}
                    >
                      <span className="flex-1 truncate">{ws.name}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {ROLE_LABELS[ws.member_role] ?? ws.member_role}
                      </span>
                      {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="border-t border-border p-1">
            <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground">
              <Plus className="h-4 w-4" />
              New workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
