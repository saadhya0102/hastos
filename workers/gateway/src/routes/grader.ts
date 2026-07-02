import type { Context } from "hono";
import type { Env, GraderRecord } from "../types";
import { verifyUser } from "../lib/auth";
import { putGrader, clearGrader, getActiveGrader, GRADER_TTL_SEC } from "../lib/registry";

const DEFAULT_IMAGE = "ghcr.io/saadhya0102/hastos-grader:latest";
const DEFAULT_ADMINS = "saadhya0102@gmail.com";

function tokenOk(env: Env, provided: unknown): boolean {
  return typeof provided === "string" && !!env.GRADER_TOKEN && provided === env.GRADER_TOKEN;
}

function validUrl(u: unknown): u is string {
  return typeof u === "string" && /^https?:\/\/[^\s]+$/i.test(u) && u.length < 512;
}

async function isAdmin(c: Context<{ Bindings: Env }>): Promise<boolean> {
  const user = await verifyUser(c.req.raw, c.env);
  if (!user) return false;
  const email = String((user.claims as { email?: string }).email ?? "").toLowerCase();
  if (!email) return false;
  const allow = (c.env.ADMIN_EMAILS ?? DEFAULT_ADMINS)
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email);
}

/** POST /grader/register — a self-hosted grader announces itself (token-gated). */
export async function graderRegisterRoute(c: Context<{ Bindings: Env }>): Promise<Response> {
  let body: { token?: string; url?: string; name?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  if (!tokenOk(c.env, body.token)) return c.json({ error: "unauthorized" }, 401);
  if (!validUrl(body.url)) return c.json({ error: "invalid_url" }, 400);

  const now = Date.now();
  const rec: GraderRecord = {
    url: body.url.replace(/\/+$/, ""),
    name: (body.name ?? "grader").slice(0, 64),
    registeredAt: now,
    lastSeen: now,
  };
  await putGrader(c.env, rec);
  return c.json({ ok: true, ttlSec: GRADER_TTL_SEC });
}

/** POST /grader/heartbeat — refresh the record's TTL (token-gated). */
export async function graderHeartbeatRoute(c: Context<{ Bindings: Env }>): Promise<Response> {
  let body: { token?: string; url?: string; name?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  if (!tokenOk(c.env, body.token)) return c.json({ error: "unauthorized" }, 401);

  const existing = await getActiveGrader(c.env);
  const now = Date.now();
  const url = validUrl(body.url) ? body.url.replace(/\/+$/, "") : existing?.url;
  if (!url) return c.json({ error: "not_registered" }, 409);
  const rec: GraderRecord = {
    url,
    name: body.name?.slice(0, 64) ?? existing?.name ?? "grader",
    registeredAt: existing?.registeredAt ?? now,
    lastSeen: now,
  };
  await putGrader(c.env, rec);
  return c.json({ ok: true, ttlSec: GRADER_TTL_SEC });
}

/** POST /grader/deregister — take the grader offline cleanly (token-gated). */
export async function graderDeregisterRoute(c: Context<{ Bindings: Env }>): Promise<Response> {
  let body: { token?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  if (!tokenOk(c.env, body.token)) return c.json({ error: "unauthorized" }, 401);
  await clearGrader(c.env);
  return c.json({ ok: true });
}

/**
 * GET /admin/grader — admin-only. Returns the current registration plus the exact
 * `docker run` command (including the token) an admin should paste on a host.
 */
export async function graderAdminRoute(c: Context<{ Bindings: Env }>): Promise<Response> {
  if (!(await isAdmin(c))) return c.json({ error: "forbidden" }, 403);

  const origin = new URL(c.req.url).origin;
  const image = c.env.GRADER_IMAGE || DEFAULT_IMAGE;
  const token = c.env.GRADER_TOKEN ?? "";
  const configured = !!token;
  const rec = await getActiveGrader(c.env);

  const command = configured
    ? [
        "docker run -d --name hastos-grader --restart unless-stopped \\",
        "  --privileged --memory=2g --cpus=2 --pids-limit=1024 \\",
        "  --tmpfs /tmp:exec --tmpfs /piston/jobs:exec,uid=1000,gid=1000,mode=711 \\",
        "  -v hastos_piston_packages:/piston/packages \\",
        `  -e WORKER_URL=${origin} \\`,
        `  -e GRADER_TOKEN=${token} \\`,
        '  -e GRADER_NAME="$(hostname)" \\',
        `  ${image}`,
      ].join("\n")
    : "";

  return c.json({
    configured,
    image,
    workerUrl: origin,
    ttlSec: GRADER_TTL_SEC,
    command,
    grader: rec
      ? {
          name: rec.name,
          // Mask the tunnel host so the raw URL isn't fully exposed in the UI.
          urlMasked: rec.url.replace(/:\/\/([^.]+)\./, "://***."),
          registeredAt: rec.registeredAt,
          lastSeen: rec.lastSeen,
          ageSec: Math.round((Date.now() - rec.lastSeen) / 1000),
        }
      : null,
  });
}
