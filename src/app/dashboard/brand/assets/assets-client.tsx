"use client";

import { useState, useTransition, useRef } from "react";
import {
  Upload,
  FileImage,
  FileVideo,
  FileText,
  File,
  Trash2,
  Search,
  X,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { uploadAsset, deleteAsset } from "./actions";
import type { Asset, AssetType } from "@/lib/asset-types";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AssetIcon({ type, className }: { type: AssetType; className?: string }) {
  const cls = cn("h-8 w-8", className);
  switch (type) {
    case "image":
      return <FileImage className={cls} />;
    case "video":
      return <FileVideo className={cls} />;
    case "document":
      return <FileText className={cls} />;
    default:
      return <File className={cls} />;
  }
}

const TYPE_FILTERS: { id: AssetType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "image", label: "Images" },
  { id: "video", label: "Videos" },
  { id: "document", label: "Documents" },
  { id: "other", label: "Other" },
];

// ---------------------------------------------------------------------------
// Asset card
// ---------------------------------------------------------------------------

function AssetCard({
  asset,
  onDelete,
}: {
  asset: Asset;
  onDelete: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      await deleteAsset(asset.id);
      onDelete(asset.id);
    });
  }

  return (
    <Card className="group relative overflow-hidden">
      {/* Preview area */}
      <div className="flex h-36 items-center justify-center bg-surface-2">
        {asset.type === "image" && asset.public_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.public_url}
            alt={asset.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <AssetIcon type={asset.type} className="text-muted" />
        )}
      </div>

      <CardContent className="p-3">
        <p className="truncate text-sm font-medium text-foreground" title={asset.name}>
          {asset.name}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-xs text-muted">{formatBytes(asset.size_bytes)}</span>
          <span className="text-xs text-muted">
            {new Date(asset.created_at).toLocaleDateString()}
          </span>
        </div>
        {asset.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-muted">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          {asset.public_url && (
            <a
              href={asset.public_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-md border border-border px-2 py-1 text-center text-xs font-medium text-foreground hover:bg-surface-2"
            >
              View
            </a>
          )}
          <button
            onClick={handleDelete}
            disabled={isPending}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium transition-colors",
              confirmDelete
                ? "bg-error text-white hover:bg-error/90"
                : "border border-border text-muted hover:bg-surface-2 hover:text-error",
            )}
          >
            {isPending ? "…" : confirmDelete ? "Confirm" : <Trash2 className="h-3.5 w-3.5" />}
          </button>
          {confirmDelete && !isPending && (
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:bg-surface-2"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Upload dropzone
// ---------------------------------------------------------------------------

function UploadZone({ onUploaded }: { onUploaded: (asset: Asset) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    Array.from(files).forEach((file) => {
      startTransition(async () => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("workspaceId", "default");
        const res = await uploadAsset(fd);
        if (res.ok && res.asset) {
          onUploaded(res.asset);
        } else {
          setError(res.error ?? "Upload failed");
        }
      });
    });
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
      )}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Upload className="mb-3 h-8 w-8 text-muted" />
      <p className="text-sm font-medium text-foreground">
        {isPending ? "Uploading…" : "Drop files here or click to upload"}
      </p>
      <p className="mt-1 text-xs text-muted">Images, videos, PDFs, and documents</p>
      {error && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-error">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main client
// ---------------------------------------------------------------------------

export function AssetsClient({
  user,
  initialAssets,
}: {
  user: SessionUser;
  initialAssets: Asset[];
}) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [typeFilter, setTypeFilter] = useState<AssetType | "all">("all");
  const [search, setSearch] = useState("");

  function handleUploaded(asset: Asset) {
    setAssets((prev) => [asset, ...prev]);
  }

  function handleDeleted(id: string) {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }

  const filtered = assets.filter((a) => {
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asset Library"
        description="Manage brand assets — logos, images, videos, and documents — for use across campaigns and content."
        icon="FolderOpen"
      />

      {/* Upload zone */}
      <UploadZone onUploaded={handleUploaded} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets…"
            className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-1">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                typeFilter === f.id
                  ? "bg-primary text-white"
                  : "border border-border text-muted hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted">{filtered.length} asset{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <File className="mb-3 h-10 w-10 text-muted" />
            <p className="text-base font-semibold text-foreground">No assets found</p>
            <p className="mt-1 text-sm text-muted">
              Upload your first asset using the drop zone above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((asset) => (
            <AssetCard key={asset.id} asset={asset} onDelete={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
