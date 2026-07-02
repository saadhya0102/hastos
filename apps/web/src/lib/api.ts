import { auth } from "./firebase";
import type {
  ExecuteRequest,
  LanguageId,
  RunResult,
  SlavaRequest,
  SubmitResult,
} from "@hasystor/shared";
import { LANGUAGES } from "@hasystor/shared";
import { isWasmLanguage, runPythonWasm } from "./wasm";

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

export interface GraderAdminInfo {
  configured: boolean;
  image: string;
  workerUrl: string;
  ttlSec: number;
  command: string;
  grader: {
    name?: string;
    urlMasked: string;
    registeredAt: number;
    lastSeen: number;
    ageSec: number;
  } | null;
}

/** Admin-only: fetch the grader hosting command + current registration. */
export async function fetchGraderAdminInfo(): Promise<GraderAdminInfo> {
  const res = await fetch(`${GATEWAY}/admin/grader`, { headers: await authHeaders() });
  if (!res.ok) throw new ApiError(`admin request failed (${res.status})`, res.status);
  return (await res.json()) as GraderAdminInfo;
}

/** How a run was (or would be) executed, for UI messaging. */
export type RunVia = "server" | "wasm";

export function runVia(language: LanguageId, graderOnline: boolean): RunVia {
  return graderOnline ? "server" : isWasmLanguage(language) ? "wasm" : "server";
}

/**
 * Run code choosing the best backend:
 *  - server grader online  -> always use the server (full capabilities).
 *  - server grader offline  -> Python runs in-browser via WASM; other languages
 *    are unavailable (they need the grader) and we surface a clear error.
 */
export async function runSmart(opts: {
  language: LanguageId;
  source: string;
  stdin?: string;
  graderOnline: boolean;
}): Promise<RunResult> {
  const { language, source, stdin, graderOnline } = opts;
  if (!graderOnline) {
    if (isWasmLanguage(language)) {
      return runPythonWasm(source, stdin ?? "");
    }
    return {
      stdout: "",
      stderr: `The grader is offline, so ${LANGUAGES[language]?.label ?? language} can't run right now. Only Python runs in your browser (WASM). Start Piston to enable the rest.`,
      exitCode: null,
      status: "error",
    };
  }
  return runCode({ language, source, stdin });
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
