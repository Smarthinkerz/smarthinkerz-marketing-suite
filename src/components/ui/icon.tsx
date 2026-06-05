"use client";

import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";

/**
 * Renders a lucide icon by string name (used for CMS-driven and registry
 * icons). Falls back to a neutral dot when the name is unknown.
 */
export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[name];
  if (!Cmp) {
    const Fallback = Icons.Circle;
    return <Fallback {...props} />;
  }
  return <Cmp {...props} />;
}
