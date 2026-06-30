import { Link } from "react-router-dom";
import { modules, lessonsForModule, allProblems, triviaBank } from "@/lib/content";
import { getLessonProgress, getProblemProgress } from "@/lib/progress";
import { Card, ProgressRing, Badge } from "@/components/ui";
import { useAuth } from "@/lib/auth";

function moduleCompletion(moduleId: string): number {
  const ls = lessonsForModule(moduleId);
  if (ls.length === 0) return 0;
  const done = ls.filter((l) => getLessonProgress(l.id).status === "completed").length;
  return done / ls.length;
}

export function Dashboard() {
  const { user } = useAuth();
  const solved = allProblems.filter((p) => getProblemProgress(p.id).status === "solved").length;

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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted">Problems solved</p>
          <p className="mt-1 text-3xl font-bold">{solved}<span className="text-base text-muted">/{allProblems.length}</span></p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Modules</p>
          <p className="mt-1 text-3xl font-bold">{modules.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Trivia facts</p>
          <p className="mt-1 text-3xl font-bold">{triviaBank.length}</p>
        </Card>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Curriculum</h2>
          <Link to="/learn" className="text-sm text-accent">View all</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {modules.map((m) => {
            const pct = moduleCompletion(m.id);
            const lessonCount = lessonsForModule(m.id).length;
            return (
              <Link key={m.id} to={`/learn/${m.id}`}>
                <Card className="flex items-center gap-4 p-4 transition-colors hover:border-accent/50">
                  <ProgressRing value={pct} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.title}</p>
                    <p className="truncate text-sm text-muted">{m.summary}</p>
                    <div className="mt-1 flex gap-2">
                      <Badge>{lessonCount} lessons</Badge>
                      {lessonCount === 0 && <Badge tone="warn">content coming</Badge>}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
