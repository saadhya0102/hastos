import { auth } from "./firebase";

/**
 * Lightweight SM-2 spaced-repetition scheduler, persisted to localStorage per
 * user. Cards are trivia facts keyed by id. Grades: again/hard/good/easy.
 */

export type Grade = "again" | "hard" | "good" | "easy";

export interface CardState {
  /** Ease factor (SM-2), min 1.3. */
  ef: number;
  /** Current interval in days. */
  interval: number;
  /** Consecutive successful reviews. */
  reps: number;
  /** Next due timestamp (ms). */
  due: number;
  lastGrade?: Grade;
}

function uid(): string {
  return auth?.currentUser?.uid ?? "local";
}

function key(): string {
  return `hasystor:${uid()}:srs`;
}

type Store = Record<string, CardState>;

function load(): Store {
  try {
    const raw = localStorage.getItem(key());
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function save(s: Store): void {
  try {
    localStorage.setItem(key(), JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function getCard(id: string): CardState | undefined {
  return load()[id];
}

export function isDue(id: string, now = Date.now()): boolean {
  const c = load()[id];
  return !c || c.due <= now;
}

const DAY = 86400000;

/** Apply an SM-2 update for a grade and persist. Returns the new state. */
export function review(id: string, grade: Grade, now = Date.now()): CardState {
  const store = load();
  const prev: CardState = store[id] ?? { ef: 2.5, interval: 0, reps: 0, due: now };

  let { ef, interval, reps } = prev;

  if (grade === "again") {
    reps = 0;
    interval = 0; // relearn now (short delay)
    ef = Math.max(1.3, ef - 0.2);
  } else {
    const q = grade === "hard" ? 3 : grade === "good" ? 4 : 5;
    ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = grade === "hard" ? 3 : 6;
    else interval = Math.round(interval * ef * (grade === "hard" ? 0.8 : 1));
  }

  const due = grade === "again" ? now + 60_000 : now + interval * DAY;
  const next: CardState = { ef, interval, reps, due, lastGrade: grade };
  store[id] = next;
  save(store);
  return next;
}

/** Split a set of ids into due and not-due (for a study session). */
export function dueCount(ids: string[], now = Date.now()): number {
  const store = load();
  return ids.filter((id) => !store[id] || store[id].due <= now).length;
}

export interface SrsSummary {
  learned: number; // reps >= 2
  learning: number; // reps 1
  fresh: number; // never seen
  dueNow: number;
}

export function summarize(ids: string[], now = Date.now()): SrsSummary {
  const store = load();
  let learned = 0;
  let learning = 0;
  let fresh = 0;
  let dueNow = 0;
  for (const id of ids) {
    const c = store[id];
    if (!c) {
      fresh++;
      dueNow++;
    } else {
      if (c.reps >= 2) learned++;
      else if (c.reps === 1) learning++;
      else fresh++;
      if (c.due <= now) dueNow++;
    }
  }
  return { learned, learning, fresh, dueNow };
}
