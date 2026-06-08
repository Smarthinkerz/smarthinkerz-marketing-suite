"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, AlignJustify, AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SortDirection = "asc" | "desc" | null;

export interface ColumnDef<T> {
  /** Unique column key (used for sorting) */
  key: string;
  /** Column header label */
  header: string;
  /** Render function for cell content */
  cell: (row: T) => React.ReactNode;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Optional className for the <td> cell */
  cellClassName?: string;
  /** Optional className for the <th> header cell */
  headerClassName?: string;
  /** Align column content */
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T> {
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Row data */
  data: T[];
  /** Key extractor for rows */
  rowKey: (row: T) => string | number;
  /** Optional caption shown above the table */
  caption?: string;
  /** Show density toggle (compact / default) */
  showDensityToggle?: boolean;
  /** Additional className for the outer wrapper */
  className?: string;
  /** Empty state message */
  emptyMessage?: string;
}

// ---------------------------------------------------------------------------
// Sort icon helper
// ---------------------------------------------------------------------------

function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === "asc") return <ChevronUp className="h-3.5 w-3.5 shrink-0 text-primary" />;
  if (direction === "desc") return <ChevronDown className="h-3.5 w-3.5 shrink-0 text-primary" />;
  return <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted opacity-50" />;
}

// ---------------------------------------------------------------------------
// DataTable
// ---------------------------------------------------------------------------

export function DataTable<T>({
  columns,
  data,
  rowKey,
  caption,
  showDensityToggle = false,
  className,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [compact, setCompact] = useState(false);

  function handleSort(key: string) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return 0;
    // Use the raw cell value for sorting — cast to string for comparison
    const aVal = String((a as Record<string, unknown>)[sortKey] ?? "");
    const bVal = String((b as Record<string, unknown>)[sortKey] ?? "");
    const cmp = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });

  const cellPadding = compact ? "px-4 py-2" : "px-4 py-3";

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border", className)}>
      {/* Toolbar */}
      {(caption || showDensityToggle) && (
        <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-2.5">
          {caption ? (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{caption}</p>
          ) : (
            <span />
          )}
          {showDensityToggle && (
            <button
              onClick={() => setCompact((c) => !c)}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted transition-colors hover:bg-surface hover:text-foreground"
              aria-label={compact ? "Switch to default density" : "Switch to compact density"}
              title={compact ? "Default density" : "Compact density"}
            >
              {compact ? (
                <AlignJustify className="h-3.5 w-3.5" />
              ) : (
                <AlignLeft className="h-3.5 w-3.5" />
              )}
              {compact ? "Default" : "Compact"}
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-surface-2">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted",
                    col.sortable && "cursor-pointer select-none hover:text-foreground",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.headerClassName,
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <SortIcon direction={sortKey === col.key ? sortDir : null} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="transition-colors hover:bg-surface-2/60"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        cellPadding,
                        "tabular-nums text-foreground",
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                        col.cellClassName,
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
