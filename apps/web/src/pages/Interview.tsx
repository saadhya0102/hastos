import { Link } from "react-router-dom";
import { interviewProblems } from "@/lib/content";
import { getProblemProgress } from "@/lib/progress";
import { Card, Badge, EmptyState } from "@/components/ui";

const THEMES: { key: string; label: string; match: string[] }[] = [
  { key: "concurrency", label: "Concurrency", match: ["concurrency", "atomics", "lock-free"] },
  { key: "memory", label: "Memory", match: ["memory", "allocator"] },
  { key: "ds", label: "Data Structures", match: ["data-structures", "ring-buffer", "cache"] },
  { key: "os", label: "Operating Systems", match: ["scheduling", "os"] },
  { key: "net", label: "Networking", match: ["networking", "http"] },
  { key: "storage", label: "Storage", match: ["storage", "database", "wal"] },
];

export function Interview() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Interview Track</h1>
        <p className="mt-1 text-muted">
          Implement the systems artifacts that real interviews ask for — graded, with trade-off follow-ups.
        </p>
      </div>

      {interviewProblems.length === 0 ? (
        <EmptyState title="Interview problems coming soon" hint="The flagship lock-free queue lands with self-hosted Judge0." />
      ) : (
        THEMES.map((theme) => {
          const items = interviewProblems.filter((p) =>
            p.topicTags.some((t) => theme.match.includes(t)),
          );
          if (items.length === 0) return null;
          return (
            <section key={theme.key}>
              <h2 className="mb-2 text-lg font-semibold">{theme.label}</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {items.map((p) => {
                  const prog = getProblemProgress(p.id);
                  return (
                    <Link key={p.id} to={`/problems/${p.id}`}>
                      <Card className="flex items-center justify-between p-4 hover:border-accent/50">
                        <p className="font-medium">{p.title}</p>
                        <div className="flex gap-2">
                          {prog.status === "solved" && <Badge tone="ok">solved</Badge>}
                          <Badge tone="accent">{p.difficulty}</Badge>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
