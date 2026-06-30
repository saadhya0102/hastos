import type { SubmitResult, TestStatus, Verdict } from "@hasystor/shared";
import { Badge } from "../ui";

const VERDICT_LABEL: Record<Verdict, string> = {
  accepted: "Accepted",
  wrong_answer: "Wrong Answer",
  compile_error: "Compile Error",
  runtime_error: "Runtime Error",
  time_limit: "Time Limit Exceeded",
  memory_limit: "Memory Limit Exceeded",
  race_detected: "Data Race Detected",
  leak_detected: "Memory Leak Detected",
  partial: "Partial",
};

function statusTone(s: TestStatus): "ok" | "bad" | "warn" {
  if (s === "pass") return "ok";
  if (s === "timeout" || s === "mle") return "warn";
  return "bad";
}

export function ResultPanel({
  result,
  onExplain,
}: {
  result: SubmitResult | null;
  onExplain?: () => void;
}) {
  if (!result) {
    return (
      <div className="p-4 text-sm text-muted">
        Submit to grade your solution against the hidden test harness.
      </div>
    );
  }
  const accepted = result.verdict === "accepted";
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge tone={accepted ? "ok" : "bad"}>{VERDICT_LABEL[result.verdict]}</Badge>
          <span className="text-sm text-muted">
            {result.testsPassed}/{result.testsTotal} tests passed
          </span>
        </div>
        {!accepted && onExplain && (
          <button
            onClick={onExplain}
            className="text-xs font-medium text-accent underline underline-offset-2"
          >
            Explain failing test with SLAVA
          </button>
        )}
      </div>

      {result.compile.status === "error" && (
        <pre className="whitespace-pre-wrap rounded-lg border border-border bg-[#0b0e14] p-3 font-mono text-xs text-bad">
          {result.compile.stderr}
        </pre>
      )}

      <ul className="space-y-2">
        {result.tests.map((t, i) => (
          <li
            key={i}
            className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface2/40 px-3 py-2"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{t.name}</span>
                <Badge tone={t.visibility === "hidden" ? "default" : "info"}>
                  {t.visibility}
                </Badge>
              </div>
              {t.message && <p className="mt-1 break-words text-xs text-muted">{t.message}</p>}
            </div>
            <Badge tone={statusTone(t.status)}>{t.status}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
