import type { Context } from "hono";
import type { Env, RunResult, SubmitResult } from "../types";
import { verifyUser } from "../lib/auth";
import { rateLimit } from "../lib/ratelimit";
import {
  execRun,
  resolveBackend,
  ExecUnavailableError,
  Judge0Error,
  PistonError,
  type Judge0Result,
} from "../lib/exec";
import { assembleHarness, getHarnessProblem } from "../lib/problems";
import { gradeHarness } from "../lib/grade";

const LANG_ID: Record<string, number> = {
  c: 50,
  cpp: 54,
  rust: 73,
  go: 60,
  asm: 45,
  python: 71,
};

/** How many times to re-run a concurrency harness on a non-TSan backend. */
const CONCURRENCY_RUNS = 10;

interface ExecuteBody {
  mode: "run" | "submit";
  problemId?: string;
  language: string;
  source?: string;
  files?: { path: string; content: string }[];
  stdin?: string;
}

function toRunResult(r: Judge0Result): RunResult {
  let status: RunResult["status"] = "finished";
  if (r.status.id === 6) status = "compile_error";
  else if (r.status.id === 5) status = "timeout";
  else if (r.status.id >= 7) status = "error";
  return {
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? r.message ?? "",
    exitCode: r.exit_code,
    timeMs: r.time ? Math.round(parseFloat(r.time) * 1000) : undefined,
    memoryKb: r.memory ?? undefined,
    status,
    compile:
      r.status.id === 6
        ? { status: "error", stderr: r.compile_output ?? "" }
        : { status: "ok", stderr: "" },
  };
}

export async function executeRoute(c: Context<{ Bindings: Env }>): Promise<Response> {
  const env = c.env;
  const user = await verifyUser(c.req.raw, env);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  let body: ExecuteBody;
  try {
    body = await c.req.json<ExecuteBody>();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  if (!body.mode || !body.language) return c.json({ error: "missing_fields" }, 400);

  const rl = await rateLimit(env, user.uid, `execute:${body.mode}`);
  if (!rl.allowed) {
    c.header("retry-after", String(rl.retryAfter ?? 60));
    return c.json({ error: "rate_limited" }, 429);
  }

  const totalSource = (body.source ?? "") + (body.files?.map((f) => f.content).join("") ?? "");
  if (totalSource.length > 65536) return c.json({ error: "source_too_large" }, 413);

  const backend = resolveBackend(env);
  const provider = backend;

  try {
    // ---- SUBMIT (graded) ----
    if (body.mode === "submit") {
      if (!body.problemId) return c.json({ error: "missing_problem_id" }, 400);
      const problem = getHarnessProblem(body.problemId);
      if (!problem) return c.json({ error: "unknown_problem" }, 404);

      const learnerSource =
        body.files?.find((f) => f.path === problem.learnerFileName)?.content ??
        body.source ??
        "";
      const h = assembleHarness(problem, learnerSource);

      // Concurrency harnesses (pthread) can pass by luck on a single run: a data
      // race only shows up in some interleavings. On backends without a race
      // detector (Piston) we re-run the harness several times and fail if ANY run
      // trips an invariant. On Judge0 the TSan build catches races in one run, so
      // we don't waste quota repeating.
      const isConcurrency =
        h.compilerOptions.includes("-pthread") || h.compilerOptions.includes("fsanitize=thread");
      const runs = isConcurrency && backend !== "judge0" ? CONCURRENCY_RUNS : 1;

      const started = Date.now();
      let result: SubmitResult | null = null;
      let passingRuns = 0;
      for (let i = 0; i < runs; i++) {
        const r = await execRun(env, {
          slug: "c",
          languageId: h.languageId,
          source: h.sourceCode,
          // Sanitizer/threading flags apply on Judge0; Piston ignores compilerOptions.
          compilerOptions: h.compilerOptions,
          cpuTimeLimit: h.cpuTimeLimit,
          wallTimeLimit: h.wallTimeLimit,
          memoryLimitKb: h.memoryLimitKb,
        });
        const graded = gradeHarness(problem, r);
        if (graded.verdict !== "accepted") {
          // Any failing run fails the submission — report it, noting which run.
          graded.meta = {
            provider,
            durationMs: Date.now() - started,
            runs: runs > 1 ? i + 1 : undefined,
          };
          return c.json(graded);
        }
        result = graded;
        passingRuns++;
      }

      // All runs passed.
      const final: SubmitResult = result ?? {
        verdict: "accepted",
        testsPassed: 0,
        testsTotal: 0,
        tests: [],
        compile: { status: "ok", stderr: "" },
      };
      final.meta = {
        provider,
        durationMs: Date.now() - started,
        runs: runs > 1 ? passingRuns : undefined,
      };
      return c.json(final);
    }

    // ---- RUN (ungraded) ----
    // For a harness problem, run the harness so the learner can preview output.
    if (body.problemId) {
      const problem = getHarnessProblem(body.problemId);
      if (problem) {
        const learnerSource =
          body.files?.find((f) => f.path === problem.learnerFileName)?.content ??
          body.source ??
          "";
        const h = assembleHarness(problem, learnerSource);
        const r = await execRun(env, {
          slug: "c",
          languageId: h.languageId,
          source: h.sourceCode,
          compilerOptions: h.compilerOptions,
          cpuTimeLimit: h.cpuTimeLimit,
          wallTimeLimit: h.wallTimeLimit,
          memoryLimitKb: h.memoryLimitKb,
        });
        return c.json(toRunResult(r));
      }
    }

    // Plain single-file run (playground / mini-IDE).
    const languageId = LANG_ID[body.language];
    if (!languageId) return c.json({ error: "unsupported_language" }, 400);
    const source = body.source ?? body.files?.[0]?.content ?? "";
    const r = await execRun(env, {
      slug: body.language,
      languageId,
      source,
      stdin: body.stdin,
      cpuTimeLimit: 5,
      wallTimeLimit: 10,
      memoryLimitKb: 131072,
    });
    return c.json(toRunResult(r));
  } catch (e) {
    if (e instanceof ExecUnavailableError) return c.json({ error: e.message }, 503);
    if (e instanceof Judge0Error) return c.json({ error: e.message }, e.status as 502);
    if (e instanceof PistonError) return c.json({ error: e.message }, e.status as 502);
    return c.json({ error: (e as Error).message }, 500);
  }
}
