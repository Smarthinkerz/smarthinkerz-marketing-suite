import "server-only";

/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * This guards abuse of expensive endpoints (AI generation, contact form) within
 * a single server instance. It is intentionally dependency-free so the app runs
 * anywhere out of the box.
 *
 * SCALING NOTE: in a multi-instance / serverless deployment, swap this for a
 * shared store (Upstash Redis, Vercel KV, or Supabase) by implementing the same
 * `rateLimit` signature. The call sites do not need to change.
 */

interface Bucket {
  hits: number[];
}

const store = new Map<string, Bucket>();

// Periodically evict stale buckets so memory stays bounded.
const SWEEP_INTERVAL = 5 * 60 * 1000;
let lastSweep = Date.now();

function sweep(windowMs: number) {
  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL) return;
  lastSweep = now;
  for (const [key, bucket] of store) {
    bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
    if (bucket.hits.length === 0) store.delete(key);
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
  resetMs: number;
}

/**
 * Records a hit for `key` and returns whether it is within `limit` per
 * `windowMs`. Uses a precise sliding window (timestamps), not fixed buckets.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(windowMs);

  const bucket = store.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    store.set(key, bucket);
    return {
      success: false,
      remaining: 0,
      limit,
      resetMs: windowMs - (now - oldest),
    };
  }

  bucket.hits.push(now);
  store.set(key, bucket);
  return {
    success: true,
    remaining: Math.max(0, limit - bucket.hits.length),
    limit,
    resetMs: windowMs,
  };
}

/** Convenience presets used across the app. */
export const RATE_LIMITS = {
  aiPerUser: { limit: 20, windowMs: 60_000 }, // 20 AI calls / minute / user
  contactPerIp: { limit: 5, windowMs: 60_000 }, // 5 contact submits / minute / ip
} as const;
