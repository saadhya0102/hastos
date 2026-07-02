import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { allProblems, modules, triviaBank, lessons } from "@/lib/content";
import { fetchGraderAdminInfo, type GraderAdminInfo } from "@/lib/api";
import { useGrader } from "@/lib/grader";
import { Card, Badge, EmptyState, Button, Stat, SectionHeading } from "@/components/ui";

const ADMIN_EMAIL = "saadhya0102@gmail.com";

function GraderHosting() {
  const { status, online, refresh } = useGrader();
  const [info, setInfo] = useState<GraderAdminInfo | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    try {
      setInfo(await fetchGraderAdminInfo());
      setErr(null);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 20000);
    return () => clearInterval(id);
  }, []);

  function copy() {
    if (!info?.command) return;
    void navigator.clipboard.writeText(info.command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <section className="space-y-4">
      <SectionHeading
        title="Grader hosting"
        action={
          <button onClick={() => { void load(); refresh(); }} className="text-sm text-accent">
            Refresh
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Grader status"
          value={online ? "Online" : "Offline"}
          tone={online ? "ok" : "warn"}
          sub={status ? `backend: ${status.backend}` : "checking…"}
        />
        <Stat
          label="Registered host"
          value={info?.grader ? (info.grader.name ?? "grader") : "—"}
          sub={info?.grader ? `seen ${info.grader.ageSec}s ago` : "none registered"}
        />
        <Stat
          label="Token"
          value={info ? (info.configured ? "set" : "missing") : "…"}
          tone={info?.configured ? "ok" : "warn"}
          sub={info?.configured ? "GRADER_TOKEN configured" : "run: wrangler secret put GRADER_TOKEN"}
        />
      </div>

      <Card className="p-5">
        <p className="text-sm text-muted">
          Run this on any always-on <span className="font-medium text-fg">amd64</span> machine with
          Docker to bring the grader online. It starts Piston, opens a tunnel, and self-registers —
          the site routes to it automatically. Unplug it and grading falls back to in-browser Python.
        </p>

        {err && <p className="mt-3 text-sm text-bad">{err}</p>}

        {info?.configured ? (
          <div className="relative mt-4">
            <pre className="overflow-x-auto rounded-lg border border-border bg-[#0b0e14] p-4 pr-24 font-mono text-xs text-slate-100">
              {info.command}
            </pre>
            <Button size="sm" className="absolute right-2 top-2" onClick={copy}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        ) : (
          <p className="mt-4 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn">
            No grader token is set. On the worker run{" "}
            <code className="font-mono">wrangler secret put GRADER_TOKEN</code> (any long random
            string), then <code className="font-mono">wrangler deploy</code> and refresh.
          </p>
        )}

        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>Install Docker on the host (one-time; Windows/macOS: Docker Desktop).</li>
          <li>Paste the command above. First run pulls the image + languages (cached after).</li>
          <li>The <span className="font-medium text-fg">Grader status</span> pill turns green within ~30s.</li>
          <li>To stop: <code className="font-mono">docker rm -f hastos-grader</code>.</li>
        </ol>
        <p className="mt-3 text-xs text-muted">
          Capped at 2 GB / 2 CPUs and sandboxed (Piston isolate). For maximum isolation, run on a
          throwaway VM instead of your main machine.
        </p>
      </Card>
    </section>
  );
}

export function Admin() {
  const { user } = useAuth();
  const isAdmin = (user?.email ?? "").toLowerCase() === ADMIN_EMAIL;

  if (!user) {
    return <EmptyState title="Sign in required" hint="Admin tools require the owner account." />;
  }
  if (!isAdmin) {
    return (
      <EmptyState
        title="Admin access required"
        hint={`Only ${ADMIN_EMAIL} can access admin tools.`}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="mt-1 text-muted">Grader hosting and a content overview of what's bundled.</p>
      </div>

      <GraderHosting />

      <section className="space-y-4">
        <SectionHeading title="Content overview" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Modules" value={modules.length} />
          <Stat label="Lessons" value={Object.keys(lessons).length} />
          <Stat label="Problems" value={allProblems.length} />
          <Stat label="Trivia" value={triviaBank.length} />
        </div>
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
