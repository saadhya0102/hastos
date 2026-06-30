import { useMemo, useState } from "react";
import { triviaBank } from "@/lib/content";
import { Button, Card, Badge, EmptyState } from "@/components/ui";

export function Review() {
  const deck = useMemo(() => [...triviaBank].sort(() => Math.random() - 0.5), []);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);

  if (deck.length === 0) return <EmptyState title="No trivia yet" />;

  const fact = deck[i % deck.length];

  function grade() {
    setRevealed(false);
    setI((n) => n + 1);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Spaced Review</h1>
        <p className="mt-1 text-muted">
          Reinforce high-value facts. (Scaffold uses a shuffled deck; SM-2 scheduling lands in a later pass.)
        </p>
      </div>

      <Card className="p-6">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {fact.tags.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
        <p className="text-lg font-medium">{fact.prompt}</p>
        {revealed ? (
          <div className="mt-4 space-y-2">
            <p className="font-medium text-fg">{fact.answer}</p>
            {fact.explanation && <p className="text-sm text-muted">{fact.explanation}</p>}
            <div className="mt-4 flex gap-2">
              <Button variant="danger" size="sm" onClick={grade}>Again</Button>
              <Button variant="outline" size="sm" onClick={grade}>Hard</Button>
              <Button size="sm" onClick={grade}>Good</Button>
              <Button variant="ghost" size="sm" onClick={grade}>Easy</Button>
            </div>
          </div>
        ) : (
          <Button className="mt-4" onClick={() => setRevealed(true)}>Reveal answer</Button>
        )}
      </Card>
      <p className="text-center text-sm text-muted">Card {(i % deck.length) + 1} of {deck.length}</p>
    </div>
  );
}
