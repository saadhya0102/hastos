import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import type { TriviaFact } from "@hasystor/content-schema";
import { triviaBank, allProblems, getProblem } from "@/lib/content";
import {
  startMockSession,
  getMockSession,
  endMockSession,
  formatRemaining,
  MOCK_DURATION_SEC,
} from "@/lib/mockSession";
import { Card, Button, Badge, EmptyState } from "@/components/ui";

type View = "choose" | "trivia" | "coding";

interface TriviaQuestion {
  prompt: string;
  options: string[];
  answer: number;
  explanation?: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildTriviaQuestions(bank: TriviaFact[], n: number): TriviaQuestion[] {
  const picks = shuffle(bank).slice(0, n);
  const allAnswers = bank.map((f) => f.answer);
  return picks.map((fact) => {
    const distractors = shuffle(allAnswers.filter((a) => a !== fact.answer)).slice(0, 3);
    const options = shuffle([fact.answer, ...distractors]);
    return {
      prompt: fact.prompt,
      options,
      answer: options.indexOf(fact.answer),
      explanation: fact.explanation,
    };
  });
}

/* ----------------------------- Trivia round ----------------------------- */

function TriviaRound({ onExit }: { onExit: () => void }) {
  const questions = useMemo(
    () => buildTriviaQuestions(triviaBank, Math.min(15, triviaBank.length)),
    [],
  );
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const [endsAt] = useState(() => Date.now() + MOCK_DURATION_SEC * 1000);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = endsAt - now;
  useEffect(() => {
    if (remaining <= 0 && !submitted) setSubmitted(true);
  }, [remaining, submitted]);

  const score = answers.reduce<number>(
    (acc, a, i) => acc + (a === questions[i].answer ? 1 : 0),
    0,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trivia Round</h1>
        <Badge tone={remaining <= 5 * 60 * 1000 ? "warn" : "accent"}>
          {remaining > 0 ? formatRemaining(remaining) : "Time's up"}
        </Badge>
      </div>

      {submitted && (
        <Card className="p-5">
          <p className="text-lg font-semibold">
            Score: {score} / {questions.length}
          </p>
          <p className="text-sm text-muted">
            {score === questions.length
              ? "Perfect run."
              : "Review the explanations below, then try again for a fresh set."}
          </p>
          <div className="mt-3 flex gap-2">
            <Button onClick={onExit} variant="outline" size="sm">Back to menu</Button>
          </div>
        </Card>
      )}

      <ol className="space-y-4">
        {questions.map((q, qi) => (
          <li key={qi}>
            <Card className="p-4">
              <p className="font-medium">{qi + 1}. {q.prompt}</p>
              <ul className="mt-3 space-y-2">
                {q.options.map((opt, oi) => {
                  const chosen = answers[qi] === oi;
                  const isAnswer = q.answer === oi;
                  return (
                    <li key={oi}>
                      <button
                        disabled={submitted}
                        onClick={() =>
                          setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))
                        }
                        className={clsx(
                          "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                          chosen ? "border-accent bg-accent/10" : "border-border hover:bg-surface2",
                          submitted && isAnswer && "border-ok bg-ok/10",
                          submitted && chosen && !isAnswer && "border-bad bg-bad/10",
                        )}
                      >
                        {opt}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {submitted && q.explanation && (
                <p className="mt-2 rounded-lg bg-surface2 p-2 text-xs text-muted">{q.explanation}</p>
              )}
            </Card>
          </li>
        ))}
      </ol>

      {!submitted && (
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onExit}>Cancel</Button>
          <Button onClick={() => setSubmitted(true)}>Submit test</Button>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Coding round ----------------------------- */

function CodingRound({ onExit }: { onExit: () => void }) {
  const [session, setSession] = useState(() => getMockSession());

  function start() {
    const pool = allProblems.map((p) => p.id);
    const chosen = shuffle(pool).slice(0, Math.min(2, pool.length));
    setSession(startMockSession(chosen));
  }

  function end() {
    endMockSession();
    setSession(null);
  }

  if (!session || session.mode !== "coding") {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <h1 className="text-2xl font-bold">Coding Round</h1>
        <Card className="p-5">
          <p>
            You'll get <strong>2 random problems</strong> and <strong>one hour</strong> on the
            clock. The countdown follows you across the app (look for the timer pill, bottom-left)
            so you can open each problem in the IDE and still see your time.
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={start}>Start 1-hour coding round</Button>
            <Button variant="ghost" onClick={onExit}>Back</Button>
          </div>
        </Card>
      </div>
    );
  }

  const problems = session.problemIds
    .map((id) => getProblem(id)?.spec)
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coding Round — in progress</h1>
        <Badge tone="accent">2 problems · 1 hour</Badge>
      </div>
      <p className="text-sm text-muted">
        Solve both before the timer (bottom-left) runs out. Open each in the IDE; your buffers
        autosave. Treat it like the real thing — reach for SLAVA only as you would an interviewer's hint.
      </p>
      <div className="space-y-3">
        {problems.map((p) => (
          <Link key={p.id} to={`/problems/${p.id}`} className="block">
            <Card className="flex items-center justify-between p-4 hover:border-accent/50">
              <div>
                <p className="font-medium">{p.title}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {p.topicTags.slice(0, 3).map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
              </div>
              <Badge tone="accent">{p.difficulty}</Badge>
            </Card>
          </Link>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="danger" onClick={end}>End session</Button>
        <Button variant="ghost" onClick={onExit}>Back to menu</Button>
      </div>
    </div>
  );
}

/* ------------------------------- Landing -------------------------------- */

export function MockInterview() {
  const [view, setView] = useState<View>(() => (getMockSession() ? "coding" : "choose"));

  if (view === "trivia") return <TriviaRound onExit={() => setView("choose")} />;
  if (view === "coding") return <CodingRound onExit={() => setView("choose")} />;

  if (triviaBank.length === 0 && allProblems.length === 0) {
    return <EmptyState title="Nothing to practice yet" />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Practice Technical Interview</h1>
        <p className="mt-1 text-muted">
          Simulate interview pressure. Pick a round — each is timed to one hour.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col p-6">
          <h2 className="text-lg font-semibold">Trivia Round</h2>
          <p className="mt-1 flex-1 text-sm text-muted">
            A rapid-fire multiple-choice test drawn from the systems trivia bank — representation,
            caches, concurrency, OS, networking, and more. Auto-graded with explanations.
          </p>
          <Button className="mt-4 self-start" onClick={() => setView("trivia")}>
            Start trivia test
          </Button>
        </Card>
        <Card className="flex flex-col p-6">
          <h2 className="text-lg font-semibold">Coding Round</h2>
          <p className="mt-1 flex-1 text-sm text-muted">
            Two random implementation problems, one hour, graded by the hidden test harness. The
            countdown follows you into the IDE.
          </p>
          <Button className="mt-4 self-start" onClick={() => setView("coding")}>
            Start coding test
          </Button>
        </Card>
      </div>
    </div>
  );
}
