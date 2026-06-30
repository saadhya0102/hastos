import { modules } from "@/lib/content";
import { Card, Badge, EmptyState } from "@/components/ui";

export function Tests() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tests & Exams</h1>
        <p className="mt-1 text-muted">
          Timed module sample tests and a comprehensive final. (Scaffold — test content is authored in a later pass.)
        </p>
      </div>
      <EmptyState
        title="Sample tests are being authored"
        hint="Each module will ship a timed test with a score report and remediation links."
      />
      <section>
        <h2 className="mb-2 text-lg font-semibold">Planned module tests</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {modules.map((m) => (
            <Card key={m.id} className="flex items-center justify-between p-4">
              <p className="font-medium">{m.title}</p>
              <Badge tone="warn">coming soon</Badge>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
