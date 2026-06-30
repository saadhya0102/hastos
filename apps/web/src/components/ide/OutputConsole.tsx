import type { RunResult } from "@hasystor/shared";

export function OutputConsole({ result }: { result: RunResult | null }) {
  if (!result) {
    return (
      <div className="p-4 text-sm text-muted">
        Run your code to see stdout, stderr, exit code, time and memory.
      </div>
    );
  }
  return (
    <div className="space-y-3 p-4 text-sm">
      <div className="flex flex-wrap gap-3 text-xs text-muted">
        <span>status: <span className="text-fg">{result.status}</span></span>
        <span>exit: <span className="text-fg">{result.exitCode ?? "—"}</span></span>
        {result.timeMs != null && <span>time: <span className="text-fg">{result.timeMs} ms</span></span>}
        {result.memoryKb != null && <span>mem: <span className="text-fg">{result.memoryKb} KB</span></span>}
      </div>
      {result.compile?.status === "error" && (
        <div>
          <p className="mb-1 text-xs font-medium text-bad">compile error</p>
          <pre className="whitespace-pre-wrap rounded-lg border border-border bg-[#0b0e14] p-3 font-mono text-xs text-bad">
            {result.compile.stderr}
          </pre>
        </div>
      )}
      {result.stdout && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted">stdout</p>
          <pre className="whitespace-pre-wrap rounded-lg border border-border bg-[#0b0e14] p-3 font-mono text-xs text-slate-100">
            {result.stdout}
          </pre>
        </div>
      )}
      {result.stderr && (
        <div>
          <p className="mb-1 text-xs font-medium text-warn">stderr</p>
          <pre className="whitespace-pre-wrap rounded-lg border border-border bg-[#0b0e14] p-3 font-mono text-xs text-warn">
            {result.stderr}
          </pre>
        </div>
      )}
    </div>
  );
}
