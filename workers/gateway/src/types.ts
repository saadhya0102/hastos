export interface Env {
  RATELIMIT?: KVNamespace;

  // vars
  ALLOW_ANON: string;
  PRIMARY_AI_ENABLED: string;
  OPENAI_BASE_URL: string;
  OPENAI_MODEL: string;
  GROQ_BASE_URL: string;
  GROQ_MODEL: string;
  ALLOWED_ORIGIN: string;
  EXEC_BACKEND?: string; // "piston" | "judge0" | "auto" (default: auto -> piston if PISTON_URL set)
  ADMIN_EMAILS?: string; // comma-separated allowlist for admin-only endpoints
  GRADER_IMAGE?: string; // docker image the Admin panel tells hosts to run

  // secrets
  OPENAI_API_KEY?: string;
  GROQ_API_KEY?: string;
  JUDGE0_URL?: string;
  JUDGE0_AUTH_TOKEN?: string;
  JUDGE0_RAPIDAPI_HOST?: string;
  PISTON_URL?: string;
  GRADER_TOKEN?: string; // shared secret a self-hosted grader uses to register
  FIREBASE_PROJECT_ID?: string;
}

export interface GraderRecord {
  url: string;
  name?: string;
  registeredAt: number;
  lastSeen: number;
}

export type ExecBackend = "piston" | "judge0" | "none";

export interface GraderStatus {
  online: boolean;
  backend: ExecBackend;
  /** Capabilities the active backend supports; drives client-side WASM gating. */
  capabilities: {
    sanitizers: boolean; // ASan/UBSan/TSan available
    threads: boolean; // pthread problems runnable
    languages: string[]; // executable language slugs
  };
  note?: string;
}

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
  message?: string;
  timeMs?: number;
  memoryKb?: number;
}

export interface SubmitResult {
  verdict: Verdict;
  testsPassed: number;
  testsTotal: number;
  tests: TestResultSummary[];
  compile: { status: "ok" | "error"; stderr: string };
  meta?: { provider: string; durationMs?: number; runs?: number };
}

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timeMs?: number;
  memoryKb?: number;
  status: "finished" | "error" | "timeout" | "compile_error";
  compile?: { status: "ok" | "error"; stderr: string };
}
