import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { allProblems, interviewProblems } from "@/lib/content";
import { getProblemProgress, currentStreak, longestStreak, getActivityLog } from "@/lib/progress";
import { computeStats, rankFor } from "@/lib/stats";
import { useGrader } from "@/lib/grader";
import { Card, Button, Badge, ProgressRing, LinearBar, Stat, SectionHeading, EmptyState } from "@/components/ui";
import { Heatmap } from "@/components/Heatmap";

function fmtMinutes(m: number): string {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function Profile() {
  const { user, logout, configured } = useAuth();
  const { status: grader } = useGrader();
  const stats = useMemo(() => computeStats(), []);
  const streak = currentStreak();
  const best = longestStreak();
  const log = getActivityLog();
  const rank = rankFor(stats.problemsSolved, stats.lessonsDone);

  const recentSolves = useMemo(
    () =>
      allProblems
        .map((p) => ({ p, prog: getProblemProgress(p.id) }))
        .filter((x) => x.prog.status === "solved" && x.prog.solvedAt)
        .sort((a, b) => (b.prog.solvedAt ?? 0) - (a.prog.solvedAt ?? 0))
        .slice(0, 6),
    [],
  );

  const interviewSolved = interviewProblems.filter(
    (p) => getProblemProgress(p.id).status === "solved",
  ).length;

  const initial = (user?.email?.[0] ?? "H").toUpperCase();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Identity header */}
      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-accent/30 via-info/20 to-accent/10" />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="-mt-10 grid h-20 w-20 shrink-0 place-items-center rounded-2xl border-4 border-surface bg-accent text-3xl font-bold text-accent-fg shadow-lg">
              {initial}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold">
                {user?.email?.split("@")[0] ?? "Guest learner"}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge tone="accent">{rank.name}</Badge>
                {streak > 0 && <Badge tone="warn">🔥 {streak}-day streak</Badge>}
                {!configured && <Badge tone="warn">demo mode</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button variant="outline" size="sm" onClick={() => void logout()}>
                Sign out
              </Button>
            ) : (
              <Link to="/login">
                <Button size="sm">Sign in</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Rank progress */}
        {rank.next && (
          <div className="border-t border-border px-6 py-4">
            <div className="mb-1 flex items-center justify-between text-xs text-muted">
              <span>{rank.name}</span>
              <span>Next: {rank.next}</span>
            </div>
            <LinearBar value={rank.progress} />
          </div>
        )}
      </Card>

      {/* Headline stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Overall completion"
          value={`${Math.round(stats.completion * 100)}%`}
          tone="accent"
          sub={`${stats.lessonsDone + stats.problemsSolved} of ${stats.lessonsTotal + stats.problemsTotal} units`}
        />
        <Stat
          label="Problems solved"
          value={
            <>
              {stats.problemsSolved}
              <span className="text-base text-muted">/{stats.problemsTotal}</span>
            </>
          }
          tone="ok"
          sub={`${stats.problemsAttempted} attempted · ${stats.totalAttempts} submissions`}
        />
        <Stat
          label="Lessons completed"
          value={
            <>
              {stats.lessonsDone}
              <span className="text-base text-muted">/{stats.lessonsTotal}</span>
            </>
          }
          sub={`~${fmtMinutes(stats.estMinutesDone)} of ${fmtMinutes(stats.estMinutesTotal)} read`}
        />
        <Stat
          label="Day streak"
          value={streak}
          tone="warn"
          sub={`best ${best} · ${Object.keys(log.days).length} active days`}
        />
      </div>

      {/* Difficulty breakdown + interview readiness */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionHeading title="Problems by difficulty" />
          <div className="space-y-4">
            {[
              { label: "Easy", solved: stats.easySolved, total: stats.easyTotal, tone: "ok" as const },
              { label: "Medium", solved: stats.medSolved, total: stats.medTotal, tone: "accent" as const },
              { label: "Hard", solved: stats.hardSolved, total: stats.hardTotal, tone: "info" as const },
            ].map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{row.label}</span>
                  <span className="tabular-nums text-muted">
                    {row.solved}/{row.total}
                  </span>
                </div>
                <LinearBar value={row.total ? row.solved / row.total : 0} tone={row.tone} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col items-center justify-center gap-2 p-5 text-center">
          <p className="text-sm text-muted">Interview readiness</p>
          <ProgressRing value={interviewProblems.length ? interviewSolved / interviewProblems.length : 0} size={96} />
          <p className="text-2xl font-bold tabular-nums">
            {interviewSolved}
            <span className="text-base text-muted">/{interviewProblems.length}</span>
          </p>
          <Link to="/interview" className="text-sm text-accent">
            Interview track →
          </Link>
        </Card>
      </div>

      {/* Activity heatmap */}
      <Card className="p-5">
        <SectionHeading title="Activity" />
        <Heatmap weeks={12} />
      </Card>

      {/* Per-module progress */}
      <section>
        <SectionHeading
          title="Module progress"
          action={
            <Link to="/learn" className="text-sm text-accent">
              Curriculum →
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
                  <p className="mt-0.5 text-xs text-muted">
                    {m.lessonsDone}/{m.lessonsTotal} lessons · {m.problemsSolved}/{m.problemsTotal} problems
                  </p>
                  <LinearBar value={m.completion} className="mt-2" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Recently solved */}
      <section>
        <SectionHeading title="Recently solved" />
        {recentSolves.length === 0 ? (
          <EmptyState title="No solves yet" hint="Solve a problem to see it here." />
        ) : (
          <div className="space-y-2">
            {recentSolves.map(({ p, prog }) => (
              <Link key={p.id} to={`/problems/${p.id}`} className="block">
                <Card className="flex items-center justify-between p-3 hover:border-accent/50">
                  <div className="flex items-center gap-2">
                    <Badge tone="ok">solved</Badge>
                    <span className="font-medium">{p.title}</span>
                  </div>
                  <span className="text-xs text-muted">
                    {prog.solvedAt ? new Date(prog.solvedAt).toLocaleDateString() : ""}
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Account + preferences */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm text-muted">Account</p>
          {user ? (
            <div className="mt-2 space-y-1">
              <p className="font-medium">{user.email}</p>
              <p className="break-all text-xs text-muted">uid: {user.uid}</p>
            </div>
          ) : (
            <p className="mt-2 text-muted">
              {configured ? "Not signed in." : "Demo mode — Firebase is not configured."}
            </p>
          )}
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Environment</p>
          <div className="mt-2 space-y-1 text-sm">
            <p className="flex items-center justify-between">
              <span className="text-muted">Grader</span>
              <Badge tone={grader?.online ? "ok" : "warn"}>
                {grader ? (grader.online ? grader.backend : "offline") : "…"}
              </Badge>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-muted">Firebase</span>
              <Badge tone={configured ? "ok" : "warn"}>{configured ? "configured" : "demo"}</Badge>
            </p>
          </div>
          <Button
            className="mt-4"
            variant="outline"
            size="sm"
            onClick={() => {
              const r = document.documentElement;
              r.classList.toggle("light");
              r.classList.toggle("dark");
            }}
          >
            Toggle theme
          </Button>
        </Card>
      </div>
    </div>
  );
}
