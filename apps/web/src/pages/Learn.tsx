import { Link } from "react-router-dom";
import { modules, lessonsForModule } from "@/lib/content";
import { Card, Badge } from "@/components/ui";

export function Learn() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Curriculum</h1>
        <p className="mt-1 text-muted">
          A blended systems course (CS:APP + OSTEP + networking & storage). Work top to bottom or jump in.
        </p>
      </div>
      <div className="space-y-3">
        {modules.map((m, i) => {
          const lessons = lessonsForModule(m.id);
          return (
            <Card key={m.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-muted">Module {i + 1}</p>
                  <Link to={`/learn/${m.id}`} className="text-lg font-semibold hover:text-accent">
                    {m.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted">{m.summary}</p>
                </div>
                <Badge tone={lessons.length ? "accent" : "warn"}>
                  {lessons.length ? `${lessons.length} lessons` : "coming soon"}
                </Badge>
              </div>
              {lessons.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                  {lessons.map((l) => (
                    <li key={l.id}>
                      <Link to={`/learn/${m.id}/${l.id}`} className="text-muted hover:text-accent">
                        {l.order + 1}. {l.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
