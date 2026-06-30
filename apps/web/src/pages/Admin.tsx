import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { allProblems, modules, triviaBank, lessons } from "@/lib/content";
import { Card, Badge, EmptyState } from "@/components/ui";

export function Admin() {
  const { user } = useAuth();
  const [isAuthor, setIsAuthor] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const u = auth?.currentUser;
      if (u) {
        const token = await u.getIdTokenResult().catch(() => null);
        setIsAuthor(token?.claims.role === "author");
      }
      setChecked(true);
    })();
  }, [user]);

  if (!checked) return <p className="text-muted">Checking permissions…</p>;
  if (!isAuthor) {
    return (
      <EmptyState
        title="Author access required"
        hint="Set a custom claim role=author on your Firebase user to access authoring tools."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Admin · Content overview</h1>
      <p className="text-muted">
        Content is authored as files (MDX + Zod-validated specs). This surface previews and validates what is bundled.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm text-muted">Modules</p>
          <p className="text-2xl font-bold">{modules.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Lessons</p>
          <p className="text-2xl font-bold">{Object.keys(lessons).length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Problems</p>
          <p className="text-2xl font-bold">{allProblems.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Trivia facts</p>
          <p className="text-2xl font-bold">{triviaBank.length}</p>
        </Card>
      </div>
      <section>
        <h2 className="mb-2 text-lg font-semibold">Problems</h2>
        <div className="space-y-2">
          {allProblems.map((p) => (
            <Card key={p.id} className="flex items-center justify-between p-3 text-sm">
              <span className="font-mono">{p.id}</span>
              <div className="flex gap-2">
                <Badge>{p.gradingMode}</Badge>
                <Badge tone="accent">{p.difficulty}</Badge>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
