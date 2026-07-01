import type { Env } from "../types";
import type { Judge0Result } from "./judge0";

/**
 * Piston adapter. Piston (https://github.com/engineering-man/piston) is a light,
 * self-hostable sandboxed execution engine. We normalize its response into the
 * same shape as {@link Judge0Result} so the grader (lib/grade.ts) and run
 * formatter (routes/execute.ts) work unchanged regardless of backend.
 *
 * Limitations vs Judge0 (documented for the "grader status" UI + problem gating):
 *  - Piston runs fixed per-language compile scripts, so we CANNOT inject compiler
 *    flags (no `-fsanitize=address,undefined`, no explicit `-pthread`). Correctness
 *    is still graded via the driver's HASYSTOR_TEST stdout; sanitizer-based
 *    memory/race detection is unavailable on Piston.
 *  - On modern glibc (2.34+) pthread symbols live in libc, so most concurrency
 *    problems still link and run; race *detection* (ThreadSanitizer) does not.
 */

export class PistonError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Our language slug -> Piston language name + main file name. */
const PISTON_LANG: Record<string, { name: string; file: string }> = {
  c: { name: "c", file: "main.c" },
  cpp: { name: "c++", file: "main.cpp" },
  rust: { name: "rust", file: "main.rs" },
  go: { name: "go", file: "main.go" },
  asm: { name: "nasm", file: "main.asm" },
  python: { name: "python", file: "main.py" },
};

interface PistonRuntime {
  language: string;
  version: string;
  aliases?: string[];
}

interface PistonExecResponse {
  run?: { stdout?: string; stderr?: string; output?: string; code?: number | null; signal?: string | null };
  compile?: { stdout?: string; stderr?: string; output?: string; code?: number | null; signal?: string | null };
  message?: string;
}

// Per-isolate cache of the runtime list so we resolve versions once.
let runtimeCache: { at: number; runtimes: PistonRuntime[] } | null = null;
const RUNTIME_TTL_MS = 5 * 60 * 1000;

/**
 * Compute the Piston v2 API base from PISTON_URL, tolerating either form:
 *   - self-hosted root:  http://localhost:2000            -> .../api/v2
 *   - public instance:   https://emkc.org/api/v2/piston   -> used as-is
 *   - a full endpoint:   http://host:2000/api/v2/execute  -> suffix stripped
 * Endpoints are then `${apiBase}/execute` and `${apiBase}/runtimes`.
 */
function apiBase(env: Env): string {
  if (!env.PISTON_URL) throw new PistonError("Piston backend is not configured.", 503);
  let u = env.PISTON_URL.trim().replace(/\/+$/, "");
  u = u.replace(/\/(execute|runtimes)$/i, "");
  if (/\/api\/v\d+/i.test(u)) return u; // already an /api/vN[/piston] base
  return `${u}/api/v2`;
}

async function fetchRuntimes(env: Env): Promise<PistonRuntime[]> {
  if (runtimeCache && Date.now() - runtimeCache.at < RUNTIME_TTL_MS) return runtimeCache.runtimes;
  const res = await fetch(`${apiBase(env)}/runtimes`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new PistonError(`Piston runtimes error (${res.status})`, 502);
  const runtimes = (await res.json()) as PistonRuntime[];
  runtimeCache = { at: Date.now(), runtimes };
  return runtimes;
}

async function resolveVersion(env: Env, langName: string): Promise<string> {
  const runtimes = await fetchRuntimes(env);
  const match = runtimes.find(
    (r) => r.language === langName || (r.aliases ?? []).includes(langName),
  );
  if (!match) throw new PistonError(`Piston has no runtime for "${langName}".`, 400);
  return match.version;
}

export interface PistonParams {
  language: string; // our slug (c, cpp, ...)
  file: { name: string; content: string };
  stdin?: string;
  compileTimeoutMs?: number;
  runTimeoutMs?: number;
  memoryLimitBytes?: number;
}

/** Execute a single-file program on Piston, normalized to a Judge0Result. */
export async function runPiston(env: Env, p: PistonParams): Promise<Judge0Result> {
  const meta = PISTON_LANG[p.language];
  if (!meta) throw new PistonError(`Unsupported language "${p.language}".`, 400);
  const version = await resolveVersion(env, meta.name);

  const body = {
    language: meta.name,
    version,
    files: [{ name: p.file.name || meta.file, content: p.file.content }],
    stdin: p.stdin ?? "",
    compile_timeout: p.compileTimeoutMs ?? 10000,
    run_timeout: p.runTimeoutMs ?? 10000,
    compile_memory_limit: -1,
    run_memory_limit: p.memoryLimitBytes ?? -1,
  };

  const res = await fetch(`${apiBase(env)}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout((p.runTimeoutMs ?? 10000) + (p.compileTimeoutMs ?? 10000) + 5000),
  });
  if (!res.ok) {
    let msg = `Piston upstream error (${res.status})`;
    try {
      const j = (await res.json()) as { message?: string };
      if (j.message) msg = j.message;
    } catch {
      /* ignore */
    }
    throw new PistonError(msg, 502);
  }

  const raw = (await res.json()) as PistonExecResponse;
  return normalize(raw);
}

function normalize(raw: PistonExecResponse): Judge0Result {
  const compile = raw.compile;
  const run = raw.run;

  // Compile step failed (compiled languages only).
  if (compile && (compile.code ?? 0) !== 0) {
    return {
      stdout: run?.stdout ?? "",
      stderr: compile.stderr ?? "",
      compile_output: compile.stderr ?? compile.output ?? "Compilation failed.",
      message: raw.message ?? null,
      exit_code: compile.code ?? 1,
      time: null,
      memory: null,
      status: { id: 6, description: "Compilation Error" },
    };
  }

  const signal = run?.signal ?? null;
  const code = run?.code ?? null;

  // Piston kills on run_timeout with SIGKILL. We cannot cleanly distinguish an
  // OOM kill, but timeout is the common case.
  let statusId = 3; // Accepted / finished
  let desc = "Accepted";
  if (signal === "SIGKILL" || signal === "SIGXCPU") {
    statusId = 5;
    desc = "Time Limit Exceeded";
  } else if (signal) {
    statusId = 11; // Runtime Error (signalled)
    desc = `Runtime Error (${signal})`;
  } else if (code !== null && code !== 0) {
    statusId = 11;
    desc = "Runtime Error";
  }

  return {
    stdout: run?.stdout ?? "",
    stderr: run?.stderr ?? "",
    compile_output: compile?.stderr && compile.stderr.length ? compile.stderr : null,
    message: raw.message ?? null,
    exit_code: code,
    time: null,
    memory: null,
    status: { id: statusId, description: desc },
  };
}

/** Whether the Piston backend is reachable (used by /grader-status). */
export async function pistonHealthy(env: Env): Promise<boolean> {
  if (!env.PISTON_URL) return false;
  try {
    const res = await fetch(`${apiBase(env)}/runtimes`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}
