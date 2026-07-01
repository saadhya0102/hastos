import { useEffect, useMemo, useState, type ReactNode } from "react";
import clsx from "clsx";
import type { LanguageId } from "@hasystor/shared";
import { runSmart } from "@/lib/api";
import { useGrader } from "@/lib/grader";
import { LANGUAGES } from "@hasystor/shared";
import type { RunResult } from "@hasystor/shared";
import { CodeEditor } from "../ide/CodeEditor";
import { OutputConsole } from "../ide/OutputConsole";
import { Button, Badge } from "../ui";
import { useCheckTracker } from "./checkTracker";

/* ----------------------------- Aside ----------------------------- */

const ASIDE_TONE: Record<string, { tone: string; label: string }> = {
  note: { tone: "border-info/40 bg-info/10", label: "Note" },
  warning: { tone: "border-warn/40 bg-warn/10", label: "Warning" },
  insight: { tone: "border-accent/40 bg-accent/10", label: "Insight" },
  pitfall: { tone: "border-bad/40 bg-bad/10", label: "Pitfall" },
};

export function Aside({ kind = "note", children }: { kind?: string; children: ReactNode }) {
  const cfg = ASIDE_TONE[kind] ?? ASIDE_TONE.note;
  return (
    <div className={clsx("my-5 rounded-lg border px-4 py-3", cfg.tone)}>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide">{cfg.label}</p>
      <div className="text-sm [&>p]:my-1">{children}</div>
    </div>
  );
}

/* ------------------------- KnowledgeCheck ------------------------ */

type CheckType = "mcq" | "boolean" | "short" | "numeric" | "predict-output";

interface KnowledgeCheckProps {
  id: string;
  type: CheckType;
  prompt: string;
  options?: string[];
  answer: number | string | boolean;
  tolerance?: number;
  explanation?: string;
  code?: string;
}

export function KnowledgeCheck(props: KnowledgeCheckProps) {
  const { id, type, prompt, options, answer, tolerance, explanation, code } = props;
  const tracker = useCheckTracker();
  const [selected, setSelected] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);

  useEffect(() => {
    tracker?.register(id);
  }, [id, tracker]);

  function grade() {
    let ok = false;
    if (type === "mcq") ok = selected === answer;
    else if (type === "boolean") ok = (text.toLowerCase() === "true") === answer;
    else if (type === "numeric") {
      const v = Number(text);
      ok = !Number.isNaN(v) && Math.abs(v - Number(answer)) <= (tolerance ?? 0);
    } else {
      ok = text.trim().toLowerCase() === String(answer).trim().toLowerCase();
    }
    setCorrect(ok);
    setSubmitted(true);
    tracker?.setPassed(id, ok);
  }

  function retry() {
    setSubmitted(false);
    setSelected(null);
    setText("");
  }

  return (
    <div className="my-6 rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <Badge tone="accent">Knowledge check</Badge>
        {submitted && <Badge tone={correct ? "ok" : "bad"}>{correct ? "Correct" : "Try again"}</Badge>}
      </div>
      <p className="font-medium">{prompt}</p>
      {code && (
        <pre className="my-3 overflow-x-auto rounded-lg border border-border bg-[#0b0e14] p-3 font-mono text-xs text-slate-100">
          {code}
        </pre>
      )}

      {type === "mcq" && options ? (
        <ul className="mt-3 space-y-2">
          {options.map((opt, i) => (
            <li key={i}>
              <button
                onClick={() => !submitted && setSelected(i)}
                className={clsx(
                  "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  selected === i ? "border-accent bg-accent/10" : "border-border hover:bg-surface2",
                  submitted && i === answer && "border-ok bg-ok/10",
                  submitted && selected === i && i !== answer && "border-bad bg-bad/10",
                )}
              >
                <span className="font-mono text-muted mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={submitted}
          placeholder={type === "boolean" ? "true / false" : "Your answer"}
          className="mt-3 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      )}

      <div className="mt-4 flex items-center gap-2">
        {!submitted ? (
          <Button size="sm" onClick={grade} disabled={type === "mcq" ? selected === null : !text}>
            Check
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={retry}>
            Retry
          </Button>
        )}
      </div>

      {submitted && explanation && (
        <p className="mt-3 rounded-lg bg-surface2 p-3 text-sm text-muted">{explanation}</p>
      )}
    </div>
  );
}

/* ---------------------------- MiniIDE ---------------------------- */

export function MiniIDE({
  language = "c",
  starter = "",
  stdin = "",
  height = 220,
}: {
  language?: LanguageId;
  starter?: string;
  stdin?: string;
  height?: number;
}) {
  const { online } = useGrader();
  const [code, setCode] = useState(starter);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const blocked = !online && !LANGUAGES[language].wasm;

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      const r = await runSmart({ language, source: code, stdin, graderOnline: online });
      setResult(r);
    } catch (e) {
      setResult({
        stdout: "",
        stderr: (e as Error).message,
        exitCode: null,
        status: "error",
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-border">
      <div className="flex items-center justify-between border-b border-border bg-surface px-3 py-2">
        <Badge tone="info">Mini IDE · {language}</Badge>
        <Button size="sm" onClick={run} disabled={running || blocked} title={blocked ? "Grader offline — needs the server" : undefined}>
          {running ? "Running…" : !online && LANGUAGES[language].wasm ? "Run in browser" : "Run"}
        </Button>
      </div>
      {blocked && (
        <div className="border-b border-warn/30 bg-warn/10 px-3 py-1.5 text-xs text-warn">
          Grader offline — {LANGUAGES[language].label} can't run here. Start Piston to enable it.
        </div>
      )}
      <div style={{ height }}>
        <CodeEditor language={language} value={code} onChange={setCode} />
      </div>
      <div className="max-h-60 overflow-auto border-t border-border bg-surface">
        <OutputConsole result={result} />
      </div>
    </div>
  );
}

/* ----------------------- MDX component map ----------------------- */

export const mdxComponents = {
  Aside,
  KnowledgeCheck,
  MiniIDE,
};
