"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { MyWorkspace, OrgRole } from "@/lib/org-types";

interface WorkspaceContextValue {
  workspaces: MyWorkspace[];
  activeWorkspace: MyWorkspace | null;
  setActiveWorkspace: (ws: MyWorkspace) => void;
  role: OrgRole | null;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaces: [],
  activeWorkspace: null,
  setActiveWorkspace: () => {},
  role: null,
});

export function WorkspaceProvider({
  workspaces,
  children,
}: {
  workspaces: MyWorkspace[];
  children: ReactNode;
}) {
  const [activeWorkspace, setActiveWorkspaceState] = useState<MyWorkspace | null>(
    workspaces[0] ?? null,
  );

  const setActiveWorkspace = useCallback((ws: MyWorkspace) => {
    setActiveWorkspaceState(ws);
  }, []);

  const role = activeWorkspace?.member_role ?? null;

  return (
    <WorkspaceContext.Provider value={{ workspaces, activeWorkspace, setActiveWorkspace, role }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  return useContext(WorkspaceContext);
}
