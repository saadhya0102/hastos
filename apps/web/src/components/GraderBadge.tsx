import { useState } from "react";
import clsx from "clsx";
import { useGrader } from "@/lib/grader";

/**
 * Grader status pill. Shows whether the server code-execution backend (Piston/
 * Judge0) is online. When offline, indicates the in-browser WASM fallback.
 * Click to see details + refresh.
 */
export function GraderBadge() {
  const { status, loading, online, refresh } = useGrader();
  const [open, setOpen] = useState(false);

  const backend = status?.backend ?? "none";
  const label = loading
    ? "Grader…"
    : online
      ? backend === "piston"
        ? "Grader: Piston"
        : "Grader: Judge0"
      : "Grader: offline";

  const dot = loading ? "bg-muted" : online ? "bg-ok" : "bg-warn";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
          online
            ? "border-ok/30 bg-ok/10 text-ok hover:bg-ok/15"
            : "border-warn/30 bg-warn/10 text-warn hover:bg-warn/15",
        )}
        title="Code execution backend status"
      >
        <span className={clsx("h-2 w-2 rounded-full", dot, !loading && online && "animate-pulse")} />
        {label}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-border bg-surface p-3 text-sm shadow-xl">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-semibold">Grader status</span>
              <button
                onClick={() => refresh()}
                className="rounded-md border border-border px-2 py-0.5 text-xs text-muted hover:text-fg"
              >
                Refresh
              </button>
            </div>
            <p className="text-xs text-muted">{status?.note ?? "Checking backend…"}</p>
            {status && (
              <dl className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted">Backend</dt>
                  <dd className="font-mono">{status.backend}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Sanitizers</dt>
                  <dd className="font-mono">{status.capabilities.sanitizers ? "yes" : "no"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Threads</dt>
                  <dd className="font-mono">{status.capabilities.threads ? "yes" : "no"}</dd>
                </div>
              </dl>
            )}
            {!online && (
              <p className="mt-2 rounded-lg bg-surface2 px-2 py-1.5 text-xs text-muted">
                In-browser fallback: <span className="text-fg">Python (WASM)</span>. C/C++/Rust/Go/ASM
                and graded problems need the server grader.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

