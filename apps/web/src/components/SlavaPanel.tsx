import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import type { HintLevel, SlavaMessage, TestResultSummary } from "@hasystor/shared";
import { slavaStream } from "@/lib/api";
import { useSlava } from "@/lib/slava";
import { useAuth } from "@/lib/auth";
import { Badge, Button } from "./ui";

interface ChatMessage extends SlavaMessage {
  provider?: string;
  degraded?: boolean;
}

const HINTS: HintLevel[] = ["nudge", "partial", "full"];

export function SlavaPanel() {
  const slava = useSlava();
  const { user, configured } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [hint, setHint] = useState<HintLevel>("nudge");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  // React to "explain failing test" requests.
  useEffect(() => {
    if (slava.pendingExplain) {
      const failure = slava.pendingExplain;
      slava.clearPending();
      void send("Why are my tests failing? Explain the likely cause.", failure.tests);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slava.pendingExplain]);

  async function send(text: string, failureTests?: TestResultSummary[]) {
    if (!text.trim() || streaming) return;
    const history = [...messages, { role: "user", content: text } as ChatMessage];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    abortRef.current = new AbortController();

    const code = slava.binding.getCode?.();
    await slavaStream(
      {
        context: slava.binding.context,
        refId: slava.binding.refId,
        hintLevel: hint,
        language: slava.binding.language,
        messages: history.map(({ role, content }) => ({ role, content })),
        code,
        failure: failureTests ? { tests: failureTests } : undefined,
      },
      {
        onProvider: (provider, degraded) =>
          setMessages((m) => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            if (last) copy[copy.length - 1] = { ...last, provider, degraded };
            return copy;
          }),
        onChunk: (chunk) =>
          setMessages((m) => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            if (last) copy[copy.length - 1] = { ...last, content: last.content + chunk };
            return copy;
          }),
        onError: (err) =>
          setMessages((m) => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            if (last)
              copy[copy.length - 1] = {
                ...last,
                content: last.content || `SLAVA is unavailable right now (${err.message}).`,
              };
            return copy;
          }),
        onDone: () => setStreaming(false),
      },
      abortRef.current.signal,
    );
    setStreaming(false);
  }

  if (!slava.open) {
    return (
      <button
        onClick={() => slava.setOpen(true)}
        className="fixed bottom-5 right-5 z-40 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-accent-fg shadow-lg hover:opacity-90"
      >
        Ask SLAVA
      </button>
    );
  }

  return (
    <aside className="fixed bottom-0 right-0 top-14 z-40 flex w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="font-semibold">SLAVA</p>
          <p className="text-xs text-muted">
            {slava.binding.context === "problem"
              ? `Problem: ${slava.binding.title ?? slava.binding.refId}`
              : slava.binding.context === "lesson"
                ? `Lesson: ${slava.binding.title ?? slava.binding.refId}`
                : "General systems help"}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => slava.setOpen(false)}>
          Close
        </Button>
      </header>

      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span className="text-xs text-muted">Hint level:</span>
        {HINTS.map((h) => (
          <button
            key={h}
            onClick={() => setHint(h)}
            className={clsx(
              "rounded-md px-2 py-1 text-xs capitalize",
              hint === h ? "bg-accent text-accent-fg" : "bg-surface2 text-muted hover:text-fg",
            )}
          >
            {h}
          </button>
        ))}
      </div>

      {configured && !user ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="font-medium">Sign in to use SLAVA</p>
          <p className="text-sm text-muted">
            SLAVA is available to signed-in learners — sign in to ask questions, get leveled hints,
            and have it explain failing tests.
          </p>
          <Link to="/login" onClick={() => slava.setOpen(false)}>
            <Button>Sign in</Button>
          </Link>
        </div>
      ) : (
        <>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="mr-6 rounded-lg bg-surface2 px-3 py-2 text-sm">
            <div className="mb-1 flex items-center gap-2 text-xs text-muted">
              <span>SLAVA</span>
              <Badge tone="accent">tutor</Badge>
            </div>
            <div className="leading-relaxed">
              Hi! I'm the <strong>Systems Learning Assistant for Verification and Assessment</strong>
              {" "}— <strong>SLAVA</strong> for short. I'm here to help
              {slava.binding.context === "problem"
                ? ` with "${slava.binding.title ?? "this problem"}"`
                : slava.binding.context === "lesson"
                  ? ` with "${slava.binding.title ?? "this lesson"}"`
                  : ""}
              : clarify a concept, give a hint (I start with a gentle nudge — bump the level up if
              you need more), or explain why a test failed. What are you working on?
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={clsx(
              "rounded-lg px-3 py-2 text-sm",
              m.role === "user" ? "ml-6 bg-accent/15" : "mr-6 bg-surface2",
            )}
          >
            <div className="mb-1 flex items-center gap-2 text-xs text-muted">
              <span>{m.role === "user" ? "You" : "SLAVA"}</span>
              {m.role === "assistant" && m.provider && (
                <Badge tone={m.degraded ? "warn" : "default"}>
                  {m.degraded ? "backup model" : m.provider}
                </Badge>
              )}
            </div>
            <div className="whitespace-pre-wrap leading-relaxed">{m.content || "…"}</div>
          </div>
        ))}
      </div>

      <form
        className="border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask SLAVA…"
            className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <Button type="submit" disabled={streaming || !input.trim()}>
            {streaming ? "…" : "Send"}
          </Button>
        </div>
      </form>
        </>
      )}
    </aside>
  );
}
