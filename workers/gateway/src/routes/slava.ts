import type { Context } from "hono";
import type { Env } from "../types";
import { verifyUser } from "../lib/auth";
import { rateLimit } from "../lib/ratelimit";
import { buildSystemPrompt } from "../lib/prompts";
import { chatStreamWithFallback, type ChatMessage } from "../lib/ai";

interface SlavaBody {
  context: "lesson" | "problem" | "general";
  refId?: string;
  hintLevel?: "nudge" | "partial" | "full";
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  code?: string;
  language?: string;
  failure?: { tests: { name: string; status: string; visibility: string; message?: string }[] };
}

const MAX_TURNS = 16;

export async function slavaRoute(c: Context<{ Bindings: Env }>): Promise<Response> {
  const env = c.env;
  const user = await verifyUser(c.req.raw, env);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  let body: SlavaBody;
  try {
    body = await c.req.json<SlavaBody>();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return c.json({ error: "no_messages" }, 400);
  }

  const rl = await rateLimit(env, user.uid, "slava");
  if (!rl.allowed) {
    c.header("retry-after", String(rl.retryAfter ?? 60));
    return c.json({ error: "rate_limited" }, 429);
  }

  // Build the model conversation: system prompt (with redacted context) + capped history.
  const system = buildSystemPrompt(body);
  const history = body.messages
    .slice(-MAX_TURNS)
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) })) as ChatMessage[];

  const messages: ChatMessage[] = [{ role: "system", content: system }, ...history];

  try {
    const { stream, provider, degraded } = await chatStreamWithFallback(env, messages);
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "x-slava-provider": provider,
        "x-slava-degraded": degraded ? "1" : "0",
      },
    });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 503);
  }
}
