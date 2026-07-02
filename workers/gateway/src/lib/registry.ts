import type { Env, GraderRecord } from "../types";

/**
 * Dynamic grader registry backed by KV. A self-hosted grader (the bundled Docker
 * image) POSTs to /grader/register with a shared token and its tunnel URL, then
 * heartbeats. The execute + grader-status paths read the active record and route
 * to it — so an admin can bring a grader online from any machine without a
 * redeploy. A single "active" slot with a TTL means: whoever registered/heartbeat
 * most recently is the grader, and if a host dies it auto-expires (pill → offline).
 */

const KEY = "grader:active";
const TTL_SEC = 120; // record expires if no heartbeat within this window

// Per-isolate micro-cache to avoid a KV read on every request.
let cache: { rec: GraderRecord | null; at: number } | null = null;
const CACHE_MS = 5000;

export async function getActiveGrader(env: Env): Promise<GraderRecord | null> {
  if (!env.RATELIMIT) return null;
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.rec;
  let rec: GraderRecord | null = null;
  try {
    const raw = await env.RATELIMIT.get(KEY);
    rec = raw ? (JSON.parse(raw) as GraderRecord) : null;
  } catch {
    rec = null;
  }
  cache = { rec, at: Date.now() };
  return rec;
}

/** URL of the currently-registered grader, if any (overrides the static secret). */
export async function getActiveGraderUrl(env: Env): Promise<string | null> {
  const rec = await getActiveGrader(env);
  return rec?.url ?? null;
}

export async function putGrader(env: Env, rec: GraderRecord): Promise<void> {
  if (!env.RATELIMIT) return;
  await env.RATELIMIT.put(KEY, JSON.stringify(rec), { expirationTtl: TTL_SEC });
  cache = { rec, at: Date.now() };
}

export async function clearGrader(env: Env): Promise<void> {
  if (!env.RATELIMIT) return;
  await env.RATELIMIT.delete(KEY);
  cache = { rec: null, at: Date.now() };
}

export const GRADER_TTL_SEC = TTL_SEC;
