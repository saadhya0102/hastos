import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { allProblems, getModule } from "@/lib/content";
import { getProblemProgress } from "@/lib/progress";
import { Card, Badge, EmptyState, Stat, LinearBar } from "@/components/ui";
import clsx from "clsx";

const DIFFS = ["all", "easy", "medium", "hard"] as const;
const STATUSES = ["all", "unsolved", "attempted", "solved"] as const;

export function Problems() {
  const [diff, setDiff] = useState<(typeof DIFFS)[number]>("all");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number]>("all");
  const [query, setQuery] = useState("");
  const [interviewOnly, setInterviewOnly] = useState(false);

  const solved = allProblems.filter((p) => getProblemProgress(p.id).status === "solved").length;

  const q = query.trim().toLowerCase();
  const list = useMemo(
    () =>
      allProblems.filter((p) => {
        if (diff !== "all" && p.difficulty !== diff) return false;
        if (interviewOnly && !p.interview) return false;
        const st = getProblemProgress(p.id).status;
        if (statusFilter === "solved" && st !== "solved") return false;
        if (statusFilter === "attempted" && st !== "attempted") return false;
        if (statusFilter === "unsolved" && st === "solved") return false;
        if (
          q &&
          !p.title.toLowerCase().includes(q) &&
          !p.topicTags.some((t) => t.toLowerCase().includes(q))
        )
          return false;
        return true;
      }),
    [diff, statusFilter, interviewOnly, q],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Problems</h1>
        <p className="mt-1 text-muted">
          Implement real systems artifacts; graded by hidden test harnesses.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Solved"
          value={
            <>
              {solved}
              <span className="text-base text-muted">/{allProblems.length}</span>
            </>
          }
          tone="ok"
        />
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Overall</p>
          <LinearBar value={allProblems.length ? solved / allProblems.length : 0} className="mt-3" tone="ok" />
          <p className="mt-2 text-xs text-muted">
            {Math.round((solved / Math.max(1, allProblems.length)) * 100)}% complete
          </p>
        </div>
        <Stat label="Showing" value={list.length} sub="after filters" />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or tag…"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent/60 focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          {DIFFS.map((d) => (
            <button
              key={d}
              onClick={() => setDiff(d)}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-sm capitalize transition-colors",
                diff === d ? "bg-accent text-accent-fg" : "bg-surface2 text-muted hover:text-fg",
              )}
            >
              {d}
            </button>
          ))}
          <span className="mx-1 w-px self-stretch bg-border" />
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-sm capitalize transition-colors",
                statusFilter === s ? "bg-accent text-accent-fg" : "bg-surface2 text-muted hover:text-fg",
              )}
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => setInterviewOnly((v) => !v)}
            className={clsx(
              "rounded-lg px-3 py-1.5 text-sm transition-colors",
              interviewOnly ? "bg-info text-white" : "bg-surface2 text-muted hover:text-fg",
            )}
          >
            interview
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState title="No problems match" hint="Try clearing a filter or search term." />
      ) : (
        <div className="space-y-3">
          {list.map((p) => {
            const prog = getProblemProgress(p.id);
            const mod = p.moduleId ? getModule(p.moduleId) : undefined;
            return (
              <Link key={p.id} to={`/problems/${p.id}`} className="block">
                <Card className="flex items-center justify-between p-4 transition-colors hover:border-accent/50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {prog.status === "solved" && <span className="text-ok">✓</span>}
                      <p className="truncate font-medium">{p.title}</p>
                      {p.interview && <Badge tone="info">interview</Badge>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {mod && <span className="text-xs text-muted">{mod.title}</span>}
                      {p.topicTags.slice(0, 3).map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {prog.status === "solved" && <Badge tone="ok">solved</Badge>}
                    {prog.status === "attempted" && <Badge tone="warn">attempted</Badge>}
                    <Badge tone="accent">{p.difficulty}</Badge>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
