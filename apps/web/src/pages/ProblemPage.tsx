import { Suspense, lazy, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Link, useParams } from "react-router-dom";
import { MDXProvider } from "@mdx-js/react";
import clsx from "clsx";
import type { LanguageId, RunResult, SubmitResult } from "@hasystor/shared";
import { LANGUAGES } from "@hasystor/shared";
import { getProblem } from "@/lib/content";
import { runCode, submitCode, runSmart, ApiError } from "@/lib/api";
import { recordSubmission } from "@/lib/progress";
import { useSlava } from "@/lib/slava";
import { useGrader } from "@/lib/grader";
import { mdxComponents } from "@/components/mdx";
import { CodeEditor } from "@/components/ide/CodeEditor";
import { ResultPanel } from "@/components/ide/ResultPanel";
import { OutputConsole } from "@/components/ide/OutputConsole";
import { Button, Badge, EmptyState } from "@/components/ui";

type Tab = "result" | "output";

export function ProblemPage() {
  const { problemId = "" } = useParams();
  const entry = getProblem(problemId);
  const slava = useSlava();
  const { online: graderOnline } = useGrader();

  const spec = entry?.spec;
  const [language, setLanguage] = useState<LanguageId>(spec?.allowedLanguages[0] ?? "c");

  // Editable starter files for the chosen language.
  const starter = spec?.starterFiles[language] ?? [];
  const editableFiles = starter.filter((f) => f.editable);
  const [activeFile, setActiveFile] = useState(0);
  const [buffers, setBuffers] = useState<Record<string, string>>({});

  const Statement = useMemo<ComponentType | null>(
    () => (entry?.loadStatement ? lazy(entry.loadStatement) : null),
    [problemId],
  );

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [subResult, setSubResult] = useState<SubmitResult | null>(null);
  const [tab, setTab] = useState<Tab>("result");
  const [error, setError] = useState<string | null>(null);
  const codeRef = useRef<() => string>(() => "");

  // Initialize buffers when language changes.
  useEffect(() => {
    if (!spec) return;
    const next: Record<string, string> = {};
    for (const f of spec.starterFiles[language] ?? []) {
      next[f.path] = buffers[f.path] ?? f.content;
    }
    setBuffers(next);
    setActiveFile(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, problemId]);

  // Bind SLAVA to this problem and expose the current code.
  useEffect(() => {
    codeRef.current = () => {
      const path = editableFiles[0]?.path;
      return path ? (buffers[path] ?? "") : "";
    };
    if (spec) {
      slava.bind({
        context: "problem",
        refId: spec.id,
        title: spec.title,
        language,
        getCode: () => codeRef.current(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buffers, language, problemId]);

  if (!spec) return <EmptyState title="Problem not found" />;

  const filesPayload = (spec.starterFiles[language] ?? []).map((f) => ({
    path: f.path,
    content: buffers[f.path] ?? f.content,
  }));

  async function run() {
    setRunning(true);
    setError(null);
    setTab("output");
    setRunResult(null);
    try {
      if (!graderOnline) {
        const editable = editableFiles[0]?.path;
        const src = editable ? (buffers[editable] ?? "") : "";
        const r = await runSmart({ language, source: src, graderOnline: false });
        setRunResult(r);
      } else {
        const r = await runCode({ language, problemId: spec!.id, files: filesPayload });
        setRunResult(r);
      }
    } catch (e) {
      handleApiError(e);
    } finally {
      setRunning(false);
    }
  }

  async function submit() {
    if (!graderOnline) {
      setTab("result");
      setError("The grader is offline — start Piston to grade this problem. (Hidden C tests need the server.)");
      return;
    }
    setSubmitting(true);
    setError(null);
    setTab("result");
    setSubResult(null);
    try {
      const r = await submitCode({ language, problemId: spec!.id, files: filesPayload });
      setSubResult(r);
      await recordSubmission(spec!.id, r);
    } catch (e) {
      handleApiError(e);
    } finally {
      setSubmitting(false);
    }
  }

  function handleApiError(e: unknown) {
    if (e instanceof ApiError && e.status === 429) {
      setError(`Rate limited. Try again${e.retryAfter ? ` in ${e.retryAfter}s` : ""}.`);
    } else {
      setError((e as Error).message);
    }
  }

  function resetFile() {
    const file = editableFiles[activeFile];
    if (file) setBuffers((b) => ({ ...b, [file.path]: file.content }));
  }

  const currentPath = editableFiles[activeFile]?.path;

  return (
    <div className="grid h-[calc(100vh-6rem)] grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Left: statement */}
      <div className="overflow-y-auto rounded-xl border border-border bg-surface p-5">
        <Link to="/problems" className="text-sm text-accent">← Problems</Link>
        <div className="mt-2 flex items-center gap-2">
          <h1 className="text-xl font-bold">{spec.title}</h1>
          <Badge tone="accent">{spec.difficulty}</Badge>
          {spec.interview && <Badge tone="info">interview</Badge>}
        </div>
        {spec.signatureNote && (
          <p className="mt-2 rounded-lg bg-surface2 px-3 py-2 font-mono text-xs text-muted">
            {spec.signatureNote}
          </p>
        )}
        <div className="prose-systems mt-4 max-w-none">
          {Statement && (
            <Suspense fallback={<p className="text-muted">Loading…</p>}>
              <MDXProvider components={mdxComponents}>
                <Statement />
              </MDXProvider>
            </Suspense>
          )}
        </div>

        {spec.constraints && (
          <div className="mt-4">
            <p className="text-sm font-semibold">Constraints</p>
            <p className="text-sm text-muted">{spec.constraints}</p>
          </div>
        )}

        {spec.examples.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold">Examples</p>
            {spec.examples.map((ex, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface2/50 p-3 text-sm">
                <p className="font-medium">{ex.title}</p>
                <p className="text-muted">{ex.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: editor + run/submit + results */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageId)}
              className="rounded-lg border border-border bg-bg px-2 py-1 text-sm"
            >
              {spec.allowedLanguages.map((l) => (
                <option key={l} value={l}>{LANGUAGES[l]?.label ?? l}</option>
              ))}
            </select>
            <Button size="sm" variant="ghost" onClick={resetFile}>Reset</Button>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={run} disabled={running || submitting}>
              {running ? "Running…" : "Run"}
            </Button>
            <Button
              size="sm"
              onClick={submit}
              disabled={running || submitting || !graderOnline}
              title={!graderOnline ? "Grader offline — start Piston to grade" : undefined}
            >
              {submitting ? "Grading…" : "Submit"}
            </Button>
          </div>
        </div>

        {!graderOnline && (
          <div className="border-b border-warn/30 bg-warn/10 px-3 py-1.5 text-xs text-warn">
            Grader offline — graded C tests need the server (Piston). Python code can still be run in
            your browser. Start the grader to submit.
          </div>
        )}

        {/* file tabs */}
        {(spec.starterFiles[language] ?? []).length > 1 && (
          <div className="flex gap-1 border-b border-border bg-surface2/40 px-2 py-1 text-xs">
            {editableFiles.map((f, i) => (
              <button
                key={f.path}
                onClick={() => setActiveFile(i)}
                className={clsx(
                  "rounded px-2 py-1 font-mono",
                  activeFile === i ? "bg-accent/20 text-accent" : "text-muted hover:text-fg",
                )}
              >
                {f.path}
              </button>
            ))}
            {starter.filter((f) => !f.editable).map((f) => (
              <span key={f.path} className="rounded px-2 py-1 font-mono text-muted/60" title="given (read-only)">
                {f.path} (given)
              </span>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1">
          {currentPath && (
            <CodeEditor
              language={language}
              value={buffers[currentPath] ?? ""}
              onChange={(v) => setBuffers((b) => ({ ...b, [currentPath]: v }))}
            />
          )}
        </div>

        <div className="border-t border-border">
          <div className="flex items-center gap-1 border-b border-border px-2 py-1 text-xs">
            <button
              onClick={() => setTab("result")}
              className={clsx("rounded px-2 py-1", tab === "result" ? "bg-accent/20 text-accent" : "text-muted")}
            >
              Tests
            </button>
            <button
              onClick={() => setTab("output")}
              className={clsx("rounded px-2 py-1", tab === "output" ? "bg-accent/20 text-accent" : "text-muted")}
            >
              Output
            </button>
            {error && <span className="ml-2 text-bad">{error}</span>}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {tab === "result" ? (
              <ResultPanel
                result={subResult}
                onExplain={
                  subResult
                    ? () => slava.explainFailingTest(subResult.tests.filter((t) => t.status !== "pass"))
                    : undefined
                }
              />
            ) : (
              <OutputConsole result={runResult} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
