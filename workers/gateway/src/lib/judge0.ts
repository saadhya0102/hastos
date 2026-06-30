import type { Env } from "../types";

export interface Judge0Result {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  exit_code: number | null;
  time: string | null; // seconds, as string
  memory: number | null; // KB
  status: { id: number; description: string };
}

export interface Judge0Params {
  languageId: number;
  sourceCode: string;
  stdin?: string;
  additionalFilesZipB64?: string;
  compilerOptions?: string;
  cpuTimeLimit?: number;
  wallTimeLimit?: number;
  memoryLimitKb?: number;
}

function b64encode(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function headers(env: Env): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (env.JUDGE0_RAPIDAPI_HOST) {
    h["X-RapidAPI-Host"] = env.JUDGE0_RAPIDAPI_HOST;
    if (env.JUDGE0_AUTH_TOKEN) h["X-RapidAPI-Key"] = env.JUDGE0_AUTH_TOKEN;
  } else if (env.JUDGE0_AUTH_TOKEN) {
    h["X-Auth-Token"] = env.JUDGE0_AUTH_TOKEN;
  }
  return h;
}

export class Judge0Error extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function runJudge0(env: Env, p: Judge0Params): Promise<Judge0Result> {
  if (!env.JUDGE0_URL) {
    throw new Judge0Error("Code execution backend is not configured.", 503);
  }
  const body: Record<string, unknown> = {
    language_id: p.languageId,
    source_code: b64encode(p.sourceCode),
    redirect_stderr_to_stdout: false,
  };
  if (p.stdin) body.stdin = b64encode(p.stdin);
  if (p.additionalFilesZipB64) body.additional_files = p.additionalFilesZipB64;
  if (p.compilerOptions) body.compiler_options = p.compilerOptions;
  if (p.cpuTimeLimit) body.cpu_time_limit = p.cpuTimeLimit;
  if (p.wallTimeLimit) body.wall_time_limit = p.wallTimeLimit;
  if (p.memoryLimitKb) body.memory_limit = p.memoryLimitKb;

  const url = `${env.JUDGE0_URL.replace(/\/$/, "")}/submissions?base64_encoded=true&wait=true`;
  const res = await fetch(url, { method: "POST", headers: headers(env), body: JSON.stringify(body) });
  if (!res.ok) {
    throw new Judge0Error(`Judge0 upstream error (${res.status})`, 502);
  }
  const raw = (await res.json()) as Record<string, unknown>;

  const dec = (v: unknown): string | null => {
    if (typeof v !== "string" || v.length === 0) return null;
    try {
      return decodeURIComponent(escape(atob(v)));
    } catch {
      return v;
    }
  };

  return {
    stdout: dec(raw.stdout),
    stderr: dec(raw.stderr),
    compile_output: dec(raw.compile_output),
    message: dec(raw.message),
    exit_code: (raw.exit_code as number) ?? null,
    time: (raw.time as string) ?? null,
    memory: (raw.memory as number) ?? null,
    status: raw.status as { id: number; description: string },
  };
}
