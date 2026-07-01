import type { Env, ExecBackend, GraderStatus } from "../types";
import { runJudge0, Judge0Error, type Judge0Result } from "./judge0";
import { runPiston, PistonError, pistonHealthy } from "./piston";

/** Decide which execution backend to use, honoring EXEC_BACKEND (default: auto). */
export function resolveBackend(env: Env): ExecBackend {
  const pref = (env.EXEC_BACKEND ?? "auto").toLowerCase();
  if (pref === "piston") return env.PISTON_URL ? "piston" : "none";
  if (pref === "judge0") return env.JUDGE0_URL ? "judge0" : "none";
  // auto: prefer Piston (the primary self-hosted grader), fall back to Judge0.
  if (env.PISTON_URL) return "piston";
  if (env.JUDGE0_URL) return "judge0";
  return "none";
}

const PISTON_FILE: Record<string, string> = {
  c: "main.c",
  cpp: "main.cpp",
  rust: "main.rs",
  go: "main.go",
  asm: "main.asm",
  python: "main.py",
};

export class ExecUnavailableError extends Error {
  constructor(message = "No code execution backend is configured.") {
    super(message);
  }
}

export interface ExecParams {
  /** Our language slug: c, cpp, rust, go, asm, python. */
  slug: string;
  /** Judge0 numeric language id (used only for the Judge0 backend). */
  languageId: number;
  source: string;
  stdin?: string;
  compilerOptions?: string; // Judge0-only (Piston can't inject flags)
  cpuTimeLimit?: number; // seconds
  wallTimeLimit?: number; // seconds
  memoryLimitKb?: number;
}

/** Run source on the active backend, normalized to a Judge0Result. */
export async function execRun(env: Env, p: ExecParams): Promise<Judge0Result> {
  const backend = resolveBackend(env);
  if (backend === "piston") {
    return runPiston(env, {
      language: p.slug,
      file: { name: PISTON_FILE[p.slug] ?? "main.txt", content: p.source },
      stdin: p.stdin,
      compileTimeoutMs: 10000,
      runTimeoutMs: Math.round((p.wallTimeLimit ?? 10) * 1000),
      memoryLimitBytes: p.memoryLimitKb ? p.memoryLimitKb * 1024 : -1,
    });
  }
  if (backend === "judge0") {
    return runJudge0(env, {
      languageId: p.languageId,
      sourceCode: p.source,
      stdin: p.stdin,
      compilerOptions: p.compilerOptions,
      cpuTimeLimit: p.cpuTimeLimit,
      wallTimeLimit: p.wallTimeLimit,
      memoryLimitKb: p.memoryLimitKb,
    });
  }
  throw new ExecUnavailableError();
}

/** Report grader availability + capabilities (drives the UI badge + WASM gating). */
export async function graderStatus(env: Env): Promise<GraderStatus> {
  const backend = resolveBackend(env);
  const languages = ["c", "cpp", "rust", "go", "asm", "python"];

  if (backend === "piston") {
    const online = await pistonHealthy(env);
    return {
      online,
      backend: "piston",
      capabilities: { sanitizers: false, threads: true, languages },
      note: online
        ? "Piston online. Compiler flags are fixed, so sanitizer-based race/leak detection is unavailable; correctness is graded via test output."
        : "Piston is configured but unreachable. Start your Piston instance (or tunnel) to grade C problems.",
    };
  }
  if (backend === "judge0") {
    let online = false;
    try {
      const url = `${env.JUDGE0_URL!.replace(/\/$/, "")}/languages`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      online = res.ok;
    } catch {
      online = false;
    }
    return {
      online,
      backend: "judge0",
      capabilities: { sanitizers: true, threads: true, languages },
      note: online ? "Judge0 online. Full sanitizer + threading support." : "Judge0 is configured but unreachable.",
    };
  }
  return {
    online: false,
    backend: "none",
    capabilities: { sanitizers: false, threads: false, languages: ["python"] },
    note: "No server grader configured. Python runs in your browser (WASM); other languages and graded C problems are unavailable until a grader is online.",
  };
}

export { Judge0Error, PistonError };
export type { Judge0Result };
