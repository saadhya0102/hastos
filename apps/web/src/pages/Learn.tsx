import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { modules, lessonsForModule, allProblems } from "@/lib/content";
import { getLessonProgress, getProblemProgress } from "@/lib/progress";
import { Card, Badge, ProgressRing, LinearBar, Stat } from "@/components/ui";
import clsx from "clsx";

function statusDot(status: string) {
  return (
    <span
      className={clsx(
        "inline-block h-2 w-2 shrink-0 rounded-full",
        status === "completed" ? "bg-ok" : status === "in_progress" ? "bg-warn" : "bg-border",
      )}
    />
  );
}

export function Learn() {
  const [query, setQuery] = useState("");

  const moduleData = useMemo(
    () =>
      modules.map((m, i) => {
        const lessons = lessonsForModule(m.id);
        const done = lessons.filter((l) => getLessonProgress(l.id).status === "completed").length;
        const probs = allProblems.filter((p) => p.moduleId === m.id);
        const solved = probs.filter((p) => getProblemProgress(p.id).status === "solved").length;
        const minutes = lessons.reduce((s, l) => s + (l.estMinutes ?? 20), 0);
        const units = lessons.length + probs.length;
        const doneUnits = done + solved;
        return {
          m,
          index: i,
          lessons,
          done,
          probs,
          solved,
          minutes,
          completion: units ? doneUnits / units : 0,
        };
      }),
    [],
  );

  const q = query.trim().toLowerCase();
  const filtered = q
    ? moduleData.filter(
        (d) =>
          d.m.title.toLowerCase().includes(q) ||
          d.m.summary.toLowerCase().includes(q) ||
          d.lessons.some((l) => l.title.toLowerCase().includes(q)),
      )
    : moduleData;

  const totalLessons = moduleData.reduce((s, d) => s + d.lessons.length, 0);
  const totalDone = moduleData.reduce((s, d) => s + d.done, 0);
  const totalMinutes = moduleData.reduce((s, d) => s + d.minutes, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Curriculum</h1>
        <p className="mt-1 text-muted">
          A blended systems course (CS:APP + OSTEP + networking &amp; storage). Work top to bottom or jump in.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Modules" value={modules.length} />
        <Stat
          label="Lessons complete"
          value={
            <>
              {totalDone}
              <span className="text-base text-muted">/{totalLessons}</span>
            </>
          }
          tone="ok"
        />
        <Stat label="Est. reading" value={`${Math.round(totalMinutes / 60)}h`} />
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search modules and lessons…"
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent/60 focus:outline-none"
      />

      <div className="space-y-3">
        {filtered.map(({ m, index, lessons, done, solved, probs, minutes, completion }) => (
          <Card key={m.id} className="p-5">
            <div className="flex items-start gap-4">
              <ProgressRing value={completion} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-muted">Module {index}</p>
                    <Link to={`/learn/${m.id}`} className="text-lg font-semibold hover:text-accent">
                      {m.title}
                    </Link>
                    <p className="mt-1 text-sm text-muted">{m.summary}</p>
                  </div>
                  <Badge tone={lessons.length ? "accent" : "warn"}>
                    {lessons.length ? `${lessons.length} lessons` : "coming soon"}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>{done}/{lessons.length} lessons</span>
                  {probs.length > 0 && <span>· {solved}/{probs.length} problems</span>}
                  {minutes > 0 && <span>· ~{minutes}m</span>}
                </div>
                <LinearBar value={completion} className="mt-2" />
              </div>
            </div>

            {lessons.length > 0 && (
              <ul className="mt-4 space-y-1.5 border-t border-border pt-3 text-sm">
                {lessons.map((l) => {
                  const st = getLessonProgress(l.id).status;
                  return (
                    <li key={l.id} className="flex items-center gap-2">
                      {statusDot(st)}
                      <Link
                        to={`/learn/${m.id}/${l.id}`}
                        className={clsx(
                          "flex-1 hover:text-accent",
                          st === "completed" ? "text-muted" : "text-fg",
                        )}
                      >
                        {l.order + 1}. {l.title}
                      </Link>
                      {l.estMinutes && <span className="text-xs text-muted">{l.estMinutes}m</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
