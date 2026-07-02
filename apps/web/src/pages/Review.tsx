import { useMemo, useState } from "react";
import { triviaBank } from "@/lib/content";
import { review, summarize, isDue, type Grade } from "@/lib/srs";
import { recordActivity } from "@/lib/progress";
import { Button, Card, Badge, EmptyState, Stat, LinearBar } from "@/components/ui";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function Review() {
  const allIds = useMemo(() => triviaBank.map((t) => t.id), []);
  const byId = useMemo(() => new Map(triviaBank.map((t) => [t.id, t])), []);

  const [queue, setQueue] = useState<string[]>(() =>
    triviaBank.filter((t) => isDue(t.id)).map((t) => t.id),
  );
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [summary, setSummary] = useState(() => summarize(allIds));
  const [mode, setMode] = useState<"due" | "ahead">("due");

  if (triviaBank.length === 0) return <EmptyState title="No trivia yet" />;

  function grade(g: Grade) {
    const id = queue[i];
    if (id) {
      review(id, g);
      recordActivity("review");
      setSummary(summarize(allIds));
    }
    setRevealed(false);
    setI((n) => n + 1);
  }

  function studyAhead() {
    setQueue(shuffle(allIds));
    setI(0);
    setRevealed(false);
    setMode("ahead");
  }

  const done = i >= queue.length;
  const fact = done ? null : byId.get(queue[i]);
  const total = allIds.length;
  const mastered = summary.learned;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Spaced Review</h1>
        <p className="mt-1 text-muted">
          SM-2 spaced repetition over the trivia bank — cards you find hard come back sooner, easy
          ones drift further out.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Due now" value={summary.dueNow} tone={summary.dueNow ? "warn" : "ok"} />
        <Stat label="Mastered" value={`${mastered}/${total}`} tone="ok" />
        <Stat label="Learning" value={summary.learning + summary.fresh} sub="new + in progress" />
      </div>
      <LinearBar value={total ? mastered / total : 0} tone="ok" />

      {done ? (
        <Card className="p-6 text-center">
          <p className="text-lg font-semibold">
            {mode === "due" ? "All caught up!" : "Session complete!"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {summary.dueNow > 0
              ? `${summary.dueNow} card${summary.dueNow === 1 ? "" : "s"} still due.`
              : "Nothing due right now — come back later, or study ahead."}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {summary.dueNow > 0 && (
              <Button
                onClick={() => {
                  setQueue(triviaBank.filter((t) => isDue(t.id)).map((t) => t.id));
                  setI(0);
                  setMode("due");
                }}
              >
                Review due ({summary.dueNow})
              </Button>
            )}
            <Button variant="outline" onClick={studyAhead}>
              Study ahead (all {total})
            </Button>
          </div>
        </Card>
      ) : (
        fact && (
          <Card className="p-6">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {fact.tags.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
              <Badge tone="accent">{fact.difficulty}</Badge>
            </div>
            <p className="text-lg font-medium">{fact.prompt}</p>

            {revealed ? (
              <div className="mt-4 space-y-2">
                <p className="font-medium text-fg">{fact.answer}</p>
                {fact.explanation && <p className="text-sm text-muted">{fact.explanation}</p>}
                <div className="mt-4 grid grid-cols-4 gap-2">
                  <Button variant="danger" size="sm" onClick={() => grade("again")}>Again</Button>
                  <Button variant="outline" size="sm" onClick={() => grade("hard")}>Hard</Button>
                  <Button size="sm" onClick={() => grade("good")}>Good</Button>
                  <Button variant="ghost" size="sm" onClick={() => grade("easy")}>Easy</Button>
                </div>
                <p className="pt-1 text-center text-xs text-muted">
                  Again = soon · Hard = shorter interval · Good/Easy = further out
                </p>
              </div>
            ) : (
              <Button className="mt-4" onClick={() => setRevealed(true)}>
                Reveal answer
              </Button>
            )}
          </Card>
        )
      )}

      {!done && (
        <p className="text-center text-sm text-muted">
          Card {i + 1} of {queue.length} {mode === "ahead" ? "(studying ahead)" : "due"}
        </p>
      )}
    </div>
  );
}
