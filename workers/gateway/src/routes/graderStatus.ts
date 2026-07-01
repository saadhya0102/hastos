import type { Context } from "hono";
import type { Env } from "../types";
import { graderStatus } from "../lib/exec";

/**
 * Public health probe for the code-execution grader (Piston/Judge0). No auth
 * required — the client polls this to show a "grader online/offline" badge and
 * to decide whether to fall back to in-browser WASM execution.
 */
export async function graderStatusRoute(c: Context<{ Bindings: Env }>): Promise<Response> {
  const status = await graderStatus(c.env);
  // Cache briefly at the edge to avoid hammering the backend on every page.
  c.header("cache-control", "public, max-age=10");
  return c.json(status);
}
