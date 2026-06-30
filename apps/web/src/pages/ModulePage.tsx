import { Link, useParams } from "react-router-dom";
import { getModule, lessonsForModule, allProblems } from "@/lib/content";
import { Card, Badge, EmptyState } from "@/components/ui";

export function ModulePage() {
  const { moduleId = "" } = useParams();
  const mod = getModule(moduleId);
  const lessons = lessonsForModule(moduleId);
  const problems = allProblems.filter((p) => p.moduleId === moduleId);

  if (!mod) return <EmptyState title="Module not found" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/learn" className="text-sm text-accent">← Curriculum</Link>
        <h1 className="mt-1 text-2xl font-bold">{mod.title}</h1>
        <p className="mt-1 text-muted">{mod.summary}</p>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Lessons</h2>
        {lessons.length === 0 ? (
          <EmptyState title="Lessons coming soon" hint="This module's theory is being authored." />
        ) : (
          <div className="space-y-2">
            {lessons.map((l) => (
              <Link key={l.id} to={`/learn/${moduleId}/${l.id}`} className="block">
                <Card className="flex items-center justify-between p-4 hover:border-accent/50">
                  <div>
                    <p className="font-medium">{l.order + 1}. {l.title}</p>
                    {l.estMinutes && <p className="text-sm text-muted">~{l.estMinutes} min</p>}
                  </div>
                  <Badge>Lesson</Badge>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Problems</h2>
        {problems.length === 0 ? (
          <EmptyState title="Problems coming soon" />
        ) : (
          <div className="space-y-2">
            {problems.map((p) => (
              <Link key={p.id} to={`/problems/${p.id}`} className="block">
                <Card className="flex items-center justify-between p-4 hover:border-accent/50">
                  <p className="font-medium">{p.title}</p>
                  <Badge tone="accent">{p.difficulty}</Badge>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
