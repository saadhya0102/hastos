import type { Context } from "hono";
import type { Env } from "../types";
import { graderStatus } from "../lib/exec";
import { getActiveGraderUrl } from "../lib/registry";

/**
 * Public health probe for the code-execution grader (Piston/Judge0). No auth
 * required — the client polls this to show a "grader online/offline" badge and
 * to decide whether to fall back to in-browser WASM execution.
 */
export async function graderStatusRoute(c: Context<{ Bindings: Env }>): Promise<Response> {
  // A dynamically-registered grader overrides the static PISTON_URL secret.
  const dynamicUrl = await getActiveGraderUrl(c.env);
  const env: Env = dynamicUrl ? { ...c.env, PISTON_URL: dynamicUrl } : c.env;
  const status = await graderStatus(env);
  // Short edge cache; low enough that a newly-registered grader shows up quickly.
  c.header("cache-control", "public, max-age=5");
  return c.json(status);
}
