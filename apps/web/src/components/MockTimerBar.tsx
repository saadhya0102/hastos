import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { endMockSession, formatRemaining, getMockSession, type MockSession } from "@/lib/mockSession";
import { Button } from "./ui";

/** Persistent bottom-left pill showing the active mock-interview countdown across all pages. */
export function MockTimerBar() {
  const [session, setSession] = useState<MockSession | null>(() => getMockSession());
  const [now, setNow] = useState(Date.now());
  const nav = useNavigate();

  useEffect(() => {
    const t = setInterval(() => {
      setSession(getMockSession());
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  if (!session) return null;

  const remaining = session.endsAt - now;
  const expired = remaining <= 0;
  const danger = remaining <= 5 * 60 * 1000;

  function end() {
    endMockSession();
    setSession(null);
  }

  return (
    <div
      className={clsx(
        "fixed bottom-5 left-5 z-40 flex items-center gap-3 rounded-full border px-4 py-2 shadow-lg",
        expired ? "border-bad/50 bg-bad/15" : danger ? "border-warn/50 bg-warn/15" : "border-border bg-surface",
      )}
    >
      <span className="text-xs text-muted">Mock interview</span>
      <span className={clsx("font-mono text-sm font-semibold", expired ? "text-bad" : danger ? "text-warn" : "text-fg")}>
        {expired ? "Time's up" : formatRemaining(remaining)}
      </span>
      <button
        onClick={() => nav("/mock-interview")}
        className="text-xs text-accent underline underline-offset-2"
      >
        view
      </button>
      <Button size="sm" variant="ghost" onClick={end}>End</Button>
    </div>
  );
}
