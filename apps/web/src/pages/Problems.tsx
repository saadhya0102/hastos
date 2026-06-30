import { useState } from "react";
import { Link } from "react-router-dom";
import { allProblems } from "@/lib/content";
import { getProblemProgress } from "@/lib/progress";
import { Card, Badge, EmptyState } from "@/components/ui";

const DIFFS = ["all", "easy", "medium", "hard"] as const;

export function Problems() {
  const [diff, setDiff] = useState<(typeof DIFFS)[number]>("all");
  const list = allProblems.filter((p) => diff === "all" || p.difficulty === diff);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Problems</h1>
        <p className="mt-1 text-muted">Implement real systems artifacts; graded by hidden test harnesses.</p>
      </div>

      <div className="flex gap-2">
        {DIFFS.map((d) => (
          <button
            key={d}
            onClick={() => setDiff(d)}
            className={`rounded-lg px-3 py-1.5 text-sm capitalize ${
              diff === d ? "bg-accent text-accent-fg" : "bg-surface2 text-muted hover:text-fg"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="No problems yet" hint="More problems are being authored." />
      ) : (
        <div className="space-y-2">
          {list.map((p) => {
            const prog = getProblemProgress(p.id);
            return (
              <Link key={p.id} to={`/problems/${p.id}`}>
                <Card className="flex items-center justify-between p-4 hover:border-accent/50">
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {p.topicTags.slice(0, 3).map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
