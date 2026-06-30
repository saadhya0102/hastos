import { Suspense, lazy, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Link, useParams } from "react-router-dom";
import { MDXProvider } from "@mdx-js/react";
import { getLesson, lessonsForModule, getProblem } from "@/lib/content";
import { mdxComponents } from "@/components/mdx";
import { CheckTrackerProvider } from "@/components/mdx/checkTracker";
import { markLessonComplete, recordCheck, getLessonProgress } from "@/lib/progress";
import { useSlava } from "@/lib/slava";
import { Button, Card, EmptyState, Badge } from "@/components/ui";
import { LoadingScreen } from "@/components/LoadingScreen";

export function LessonPage() {
  const { moduleId = "", lessonId = "" } = useParams();
  const entry = getLesson(lessonId);
  const slava = useSlava();
  const [checks, setChecks] = useState({ passed: 0, total: 0 });
  const [completed, setCompleted] = useState(
    () => getLessonProgress(lessonId).status === "completed",
  );
  const endRef = useRef<HTMLDivElement>(null);

  const Lesson = useMemo<ComponentType | null>(
    () => (entry ? lazy(entry.load) : null),
    [lessonId],
  );

  useEffect(() => {
    if (entry) {
      slava.bind({
        context: "lesson",
        refId: entry.meta.id,
        title: entry.meta.title,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  useEffect(() => {
    if (checks.total > 0) void recordCheck(lessonId, checks.passed, checks.total);
  }, [checks, lessonId]);

  if (!entry || !Lesson) return <EmptyState title="Lesson not found" />;

  const siblings = lessonsForModule(moduleId);
  const idx = siblings.findIndex((l) => l.id === lessonId);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const relatedProblems = entry.meta.relatedProblems
    .map((id) => getProblem(id)?.spec)
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  async function complete() {
    await markLessonComplete(lessonId, moduleId);
    setCompleted(true);
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-[1fr_220px]">
      <article>
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Link to={`/learn/${moduleId}`} className="text-accent">← {entry.meta.moduleId}</Link>
          {completed && <Badge tone="ok">Completed</Badge>}
        </div>

        <CheckTrackerProvider onChange={(passed, total) => setChecks({ passed, total })}>
          <MDXProvider components={mdxComponents}>
            <div className="prose-systems max-w-none">
              <Suspense fallback={<LoadingScreen preferTags={entry.meta.triviaTags} />}>
                <Lesson />
              </Suspense>
            </div>
          </MDXProvider>
        </CheckTrackerProvider>

        <div ref={endRef} />

        {relatedProblems.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold">Practice</h2>
            <p className="mb-3 text-sm text-muted">
              Apply this lesson's ideas in the IDE — these problems build on what you just learned.
            </p>
            <div className="space-y-2">
              {relatedProblems.map((p) => (
                <Link key={p.id} to={`/problems/${p.id}`}>
                  <Card className="flex items-center justify-between p-4 hover:border-accent/50">
                    <span className="font-medium">{p.title}</span>
                    <Badge tone="accent">{p.difficulty}</Badge>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        <Card className="mt-10 flex items-center justify-between p-4">
          <div className="text-sm text-muted">
            {checks.total > 0 ? `Knowledge checks: ${checks.passed}/${checks.total}` : "Reached the end?"}
          </div>
          <Button onClick={complete} disabled={completed}>
            {completed ? "Completed" : "Mark complete"}
          </Button>
        </Card>

        <div className="mt-6 flex justify-between">
          {prev ? (
            <Link to={`/learn/${moduleId}/${prev.id}`}>
              <Button variant="outline">← {prev.title}</Button>
            </Link>
          ) : <span />}
          {next ? (
            <Link to={`/learn/${moduleId}/${next.id}`}>
              <Button variant="outline">{next.title} →</Button>
            </Link>
          ) : <span />}
        </div>
      </article>

      <aside className="hidden lg:block">
        <div className="sticky top-20 space-y-3">
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Objectives</p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {entry.meta.objectives.map((o, i) => (
                <li key={i}>• {o}</li>
              ))}
            </ul>
          </Card>
          <Button variant="outline" className="w-full" onClick={() => slava.setOpen(true)}>
            Ask SLAVA about this lesson
          </Button>
        </div>
      </aside>
    </div>
  );
}
