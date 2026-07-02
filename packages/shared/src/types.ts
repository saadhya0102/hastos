import type { LanguageId } from "./languages";

/** Final verdict for a graded submission. */
export type Verdict =
  | "accepted"
  | "wrong_answer"
  | "compile_error"
  | "runtime_error"
  | "time_limit"
  | "memory_limit"
  | "race_detected"
  | "leak_detected"
  | "partial";

export type TestStatus = "pass" | "fail" | "error" | "timeout" | "mle" | "compile_error";

export interface TestResultSummary {
  name: string;
  visibility: "sample" | "hidden";
  status: TestStatus;
  /** Sanitized message — never contains hidden test inputs. */
  message?: string;
  timeMs?: number;
  memoryKb?: number;
}

/** Response of POST /execute when mode === "submit". */
export interface SubmitResult {
  verdict: Verdict;
  testsPassed: number;
  testsTotal: number;
  tests: TestResultSummary[];
  compile: { status: "ok" | "error"; stderr: string };
  meta?: { provider: string; queuedMs?: number; durationMs?: number; runs?: number };
}

/** Response of POST /execute when mode === "run". */
export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timeMs?: number;
  memoryKb?: number;
  status: "finished" | "error" | "timeout" | "compile_error";
  compile?: { status: "ok" | "error"; stderr: string };
}

export type SlavaContext = "lesson" | "problem" | "general";
export type HintLevel = "nudge" | "partial" | "full";

export interface SlavaMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface SlavaRequest {
  context: SlavaContext;
  refId?: string;
  hintLevel?: HintLevel;
  threadId?: string;
  messages: SlavaMessage[];
  code?: string;
  language?: LanguageId;
  /** Sanitized failing-test summaries only (no hidden inputs). */
  failure?: { tests: TestResultSummary[] };
}

export interface ExecuteRequest {
  mode: "run" | "submit";
  problemId?: string;
  language: LanguageId;
  source?: string;
  files?: { path: string; content: string }[];
  stdin?: string;
}

export type ExecBackend = "piston" | "judge0" | "none";

/** Response of GET /grader-status — drives the grader badge + WASM fallback gating. */
export interface GraderStatus {
  online: boolean;
  backend: ExecBackend;
  capabilities: {
    sanitizers: boolean;
    threads: boolean;
    languages: string[];
  };
  note?: string;
}
