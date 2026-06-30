import { auth } from "./firebase";
import type {
  ExecuteRequest,
  RunResult,
  SlavaRequest,
  SubmitResult,
} from "@hasystor/shared";

const GATEWAY = import.meta.env.VITE_GATEWAY_URL || "http://127.0.0.1:8787";

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = await auth?.currentUser?.getIdToken().catch(() => null);
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export class ApiError extends Error {
  status: number;
  retryAfter?: number;
  constructor(message: string, status: number, retryAfter?: number) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${GATEWAY}${path}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const retryAfter = Number(res.headers.get("retry-after")) || undefined;
    let msg = `Request failed (${res.status})`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(msg, res.status, retryAfter);
  }
  return (await res.json()) as T;
}

export function runCode(req: Omit<ExecuteRequest, "mode">): Promise<RunResult> {
  return postJson<RunResult>("/execute", { ...req, mode: "run" });
}

export function submitCode(req: Omit<ExecuteRequest, "mode">): Promise<SubmitResult> {
  return postJson<SubmitResult>("/execute", { ...req, mode: "submit" });
}

export interface SlavaStreamHandlers {
  onChunk: (text: string) => void;
  onProvider?: (provider: string, degraded: boolean) => void;
  onDone?: () => void;
  onError?: (err: Error) => void;
}

/** Streams SLAVA's reply token-by-token (plain-text chunked stream). */
export async function slavaStream(
  req: SlavaRequest,
  handlers: SlavaStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  try {
    const res = await fetch(`${GATEWAY}/slava`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(req),
      signal,
    });
    if (!res.ok || !res.body) {
      throw new ApiError(`SLAVA request failed (${res.status})`, res.status);
    }
    handlers.onProvider?.(
      res.headers.get("x-slava-provider") || "unknown",
      res.headers.get("x-slava-degraded") === "1",
    );
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      handlers.onChunk(decoder.decode(value, { stream: true }));
    }
    handlers.onDone?.();
  } catch (err) {
    handlers.onError?.(err as Error);
  }
}

export const gatewayUrl = GATEWAY;
