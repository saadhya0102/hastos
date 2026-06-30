import type { Env } from "../types";

/**
 * Simple fixed-window rate limiter backed by KV. Degrades to "allow" when no KV is bound
 * (e.g., local dev without a namespace). See PRD §13.4.
 */
export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

const LIMITS: Record<string, { max: number; windowSec: number }> = {
  "execute:run": { max: 60, windowSec: 300 },
  "execute:submit": { max: 40, windowSec: 300 },
  slava: { max: 50, windowSec: 300 },
};

export async function rateLimit(
  env: Env,
  uid: string,
  bucket: keyof typeof LIMITS | string,
): Promise<RateLimitResult> {
  if (!env.RATELIMIT) return { allowed: true };
  const cfg = LIMITS[bucket] ?? { max: 60, windowSec: 300 };
  const window = Math.floor(Date.now() / 1000 / cfg.windowSec);
  const key = `rl:${bucket}:${uid}:${window}`;
  const current = Number((await env.RATELIMIT.get(key)) ?? "0");
  if (current >= cfg.max) {
    return { allowed: false, retryAfter: cfg.windowSec };
  }
  await env.RATELIMIT.put(key, String(current + 1), { expirationTtl: cfg.windowSec + 5 });
  return { allowed: true };
}
