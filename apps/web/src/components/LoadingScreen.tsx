import { useEffect, useMemo, useState } from "react";
import { randomTrivia } from "@/lib/content";
import { Spinner } from "./ui";

/** Full-screen loading state with a trivia card (PRD §18.2). */
export function LoadingScreen({ preferTags = [] }: { preferTags?: string[] }) {
  const fact = useMemo(() => randomTrivia(preferTags), [preferTags.join(",")]);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8">
      <div className="flex items-center gap-3 text-muted">
        <Spinner className="text-accent" />
        <span>Loading…</span>
      </div>
      {fact && (
        <div className="max-w-lg rounded-xl border border-border bg-surface p-5">
          <p className="text-xs uppercase tracking-wide text-accent">Did you know?</p>
          <p className="mt-2 font-medium">{fact.prompt}</p>
          {revealed ? (
            <div className="mt-3 space-y-1 text-sm">
              <p className="text-fg">{fact.answer}</p>
              {fact.explanation && <p className="text-muted">{fact.explanation}</p>}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">Thinking it through…</p>
          )}
        </div>
      )}
    </div>
  );
}

export function InlineLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <Spinner /> {label}
    </div>
  );
}
