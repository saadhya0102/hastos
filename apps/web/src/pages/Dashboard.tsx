import { useMemo } from "react";
import { Link } from "react-router-dom";
import { modules, lessonsForModule, allProblems } from "@/lib/content";
import { getLessonProgress, getProblemProgress, currentStreak } from "@/lib/progress";
import { computeStats, rankFor } from "@/lib/stats";
import { Card, ProgressRing, Badge, Stat, LinearBar, SectionHeading, Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";

/** The first not-completed lesson across the curriculum, in module/order sequence. */
function nextLesson(): { moduleId: string; lessonId: string; title: string; moduleTitle: string } | null {
  for (const m of modules) {
    for (const l of lessonsForModule(m.id)) {
      if (getLessonProgress(l.id).status !== "completed") {
        return { moduleId: m.id, lessonId: l.id, title: l.title, moduleTitle: m.title };
      }
    }
  }
  return null;
}

export function Dashboard() {
  const { user } = useAuth();
  const stats = useMemo(() => computeStats(), []);
  const streak = currentStreak();
  const rank = rankFor(stats.problemsSolved, stats.lessonsDone);
  const resume = useMemo(() => nextLesson(), []);

  // Suggest a few unsolved problems, easy first, to nudge practice.
  const suggested = useMemo(
    () =>
      allProblems
        .filter((p) => getProblemProgress(p.id).status !== "solved")
        .sort((a, b) => {
          const rank = { easy: 0, medium: 1, hard: 2 } as const;
          return rank[a.difficulty] - rank[b.difficulty];
        })
        .slice(0, 4),
    [],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome{user?.email ? `, ${user.email.split("@")[0]}` : " to HastOS"}
        </h1>
        <p className="mt-1 text-muted">
          Learn systems programming by doing — theory, a graded in-browser IDE, and SLAVA, your AI tutor.
        </p>
      </div>

      {/* Continue learning */}
      {resume && (
        <Card className="flex flex-col gap-4 border-accent/30 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-accent">Continue where you left off</p>
            <p className="mt-1 truncate text-lg font-semibold">{resume.title}</p>
            <p className="truncate text-sm text-muted">{resume.moduleTitle}</p>
          </div>
          <Link to={`/learn/${resume.moduleId}/${resume.lessonId}`} className="shrink-0">
            <Button>Resume lesson →</Button>
          </Link>
        </Card>
      )}

      {/* Headline stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Completion" value={`${Math.round(stats.completion * 100)}%`} tone="accent" />
        <Stat
          label="Problems solved"
          value={
            <>
              {stats.problemsSolved}
              <span className="text-base text-muted">/{stats.problemsTotal}</span>
            </>
          }
          tone="ok"
        />
        <Stat
          label="Lessons done"
          value={
            <>
              {stats.lessonsDone}
              <span className="text-base text-muted">/{stats.lessonsTotal}</span>
            </>
          }
        />
        <Stat label="Streak" value={streak ? `${streak}🔥` : "0"} tone="warn" sub={rank.name} />
      </div>

      {/* Suggested practice */}
      {suggested.length > 0 && (
        <section>
          <SectionHeading
            title="Suggested practice"
            action={
              <Link to="/problems" className="text-sm text-accent">
                All problems →
              </Link>
            }
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {suggested.map((p) => {
              const prog = getProblemProgress(p.id);
              return (
                <Link key={p.id} to={`/problems/${p.id}`} className="block">
                  <Card className="flex items-center justify-between p-4 transition-colors hover:border-accent/50">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.title}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {p.topicTags.slice(0, 2).map((t) => (
                          <Badge key={t}>{t}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {prog.status === "attempted" && <Badge tone="warn">attempted</Badge>}
                      <Badge tone="accent">{p.difficulty}</Badge>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <SectionHeading
          title="Curriculum"
          action={
            <Link to="/learn" className="text-sm text-accent">
              View all →
            </Link>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.perModule.map((m) => (
            <Link key={m.id} to={`/learn/${m.id}`}>
              <Card className="flex items-center gap-4 p-4 transition-colors hover:border-accent/50">
                <ProgressRing value={m.completion} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{m.title}</p>
                  <p className="truncate text-sm text-muted">{m.summary}</p>
                  <div className="mt-1 flex gap-2">
                    <Badge>{m.lessonsTotal} lessons</Badge>
                    {m.problemsTotal > 0 && <Badge>{m.problemsTotal} problems</Badge>}
                    {m.lessonsTotal === 0 && <Badge tone="warn">content coming</Badge>}
                  </div>
                  <LinearBar value={m.completion} className="mt-2" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
