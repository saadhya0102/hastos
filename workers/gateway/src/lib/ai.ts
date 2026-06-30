import type { Env } from "../types";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface Provider {
  name: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
}

export interface ChatStream {
  stream: ReadableStream<Uint8Array>;
  provider: string;
  degraded: boolean;
}

/**
 * Transform an OpenAI-style SSE chat stream into a plain-text token stream.
 * Uses a TransformStream + pipeThrough (the idiomatic, reliably-flushed approach in the
 * Workers runtime) rather than a hand-rolled pull-based ReadableStream.
 */
function sseToText(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "" || data === "[DONE]") continue;
        try {
          const json = JSON.parse(data) as {
            choices?: { delta?: { content?: string } }[];
          };
          const token = json.choices?.[0]?.delta?.content;
          if (token) controller.enqueue(encoder.encode(token));
        } catch {
          /* ignore keep-alive / partial frames */
        }
      }
    },
  });

  return body.pipeThrough(transform);
}

async function tryProvider(p: Provider, messages: ChatMessage[]): Promise<Response | null> {
  if (!p.apiKey) return null;
  try {
    const res = await fetch(`${p.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${p.apiKey}`,
      },
      body: JSON.stringify({
        model: p.model,
        messages,
        stream: true,
        temperature: 0.3,
      }),
    });
    if (!res.ok || !res.body) return null;
    return res;
  } catch {
    return null;
  }
}

export async function chatStreamWithFallback(
  env: Env,
  messages: ChatMessage[],
): Promise<ChatStream> {
  const openai: Provider = {
    name: "openai",
    baseUrl: env.OPENAI_BASE_URL,
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
  };
  const groq: Provider = {
    name: "groq",
    baseUrl: env.GROQ_BASE_URL,
    apiKey: env.GROQ_API_KEY,
    model: env.GROQ_MODEL,
  };

  const primaryEnabled = env.PRIMARY_AI_ENABLED === "true" && Boolean(openai.apiKey);
  const primaryName = primaryEnabled ? "openai" : "groq";
  const order: Provider[] = primaryEnabled ? [openai, groq] : [groq, openai];

  for (const p of order) {
    const res = await tryProvider(p, messages);
    if (res?.body) {
      return {
        stream: sseToText(res.body),
        provider: p.name,
        degraded: p.name !== primaryName,
      };
    }
  }
  throw new Error("No AI provider is available (check OPENAI_API_KEY / GROQ_API_KEY).");
}
