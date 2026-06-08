/**
 * Asset (DAM) — client-safe types.
 * This file has NO server-side imports and is safe to use in Client Components.
 */

export type AssetType = "image" | "video" | "document" | "other";

export interface Asset {
  id: string;
  workspace_id: string;
  uploader_id: string;
  name: string;
  type: AssetType;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  public_url: string | null;
  tags: string[];
  created_at: string;
}
