import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { SubmitResult } from "@hasystor/shared";

/**
 * Progress is written to Firestore when available, with a localStorage mirror so the UI
 * is instant and works in demo mode (no Firebase configured). See PRD §9.
 */

function uid(): string {
  return auth?.currentUser?.uid ?? "local";
}

function lsKey(kind: string, id: string): string {
  return `hasystor:${uid()}:${kind}:${id}`;
}

export interface LessonProgress {
  status: "not_started" | "in_progress" | "completed";
  checksPassed: number;
  checksTotal: number;
}

export interface ProblemProgress {
  status: "not_started" | "attempted" | "solved";
  testsPassed: number;
  testsTotal: number;
  attempts: number;
  solvedAt?: number;
  bestVerdict?: string;
}

function readLocal<T>(kind: string, id: string): T | null {
  try {
    const raw = localStorage.getItem(lsKey(kind, id));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeLocal(kind: string, id: string, value: unknown): void {
  try {
    localStorage.setItem(lsKey(kind, id), JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

async function writeFirestore(path: string[], value: object): Promise<void> {
  if (!db || !auth?.currentUser) return;
  try {
    const ref = doc(db, ...(path as [string, ...string[]]));
    await setDoc(ref, { ...value, updatedAt: serverTimestamp() }, { merge: true });
  } catch {
    /* best-effort */
  }
}

export function getLessonProgress(lessonId: string): LessonProgress {
  return (
    readLocal<LessonProgress>("lesson", lessonId) ?? {
      status: "not_started",
      checksPassed: 0,
      checksTotal: 0,
    }
  );
}

export async function markLessonComplete(lessonId: string, moduleId: string): Promise<void> {
  const current = getLessonProgress(lessonId);
  const next: LessonProgress = { ...current, status: "completed" };
  writeLocal("lesson", lessonId, next);
  if (current.status !== "completed") recordActivity("lesson");
  await writeFirestore(["progress", uid(), "lessons", lessonId], {
    ...next,
    moduleId,
  });
}

export async function recordCheck(
  lessonId: string,
  passed: number,
  total: number,
): Promise<void> {
  const current = getLessonProgress(lessonId);
  const next: LessonProgress = {
    status: current.status === "completed" ? "completed" : "in_progress",
    checksPassed: passed,
    checksTotal: total,
  };
  writeLocal("lesson", lessonId, next);
  await writeFirestore(["progress", uid(), "lessons", lessonId], next);
}

export function getProblemProgress(problemId: string): ProblemProgress {
  return (
    readLocal<ProblemProgress>("problem", problemId) ?? {
      status: "not_started",
      testsPassed: 0,
      testsTotal: 0,
      attempts: 0,
    }
  );
}

export async function recordSubmission(
  problemId: string,
  result: SubmitResult,
): Promise<void> {
  const current = getProblemProgress(problemId);
  const solved = result.verdict === "accepted";
  const wasSolved = current.status === "solved";
  const next: ProblemProgress = {
    status: solved ? "solved" : wasSolved ? "solved" : "attempted",
    testsPassed: Math.max(current.testsPassed, result.testsPassed),
    testsTotal: result.testsTotal,
    attempts: current.attempts + 1,
    solvedAt: solved && !wasSolved ? Date.now() : current.solvedAt,
    bestVerdict: solved ? "accepted" : current.bestVerdict ?? result.verdict,
  };
  writeLocal("problem", problemId, next);
  recordActivity(solved && !wasSolved ? "solve" : "attempt");
  await writeFirestore(["progress", uid(), "problems", problemId], {
    ...next,
    bestVerdict: result.verdict,
  });
}

/* ------------------------------------------------------------------ */
/* Activity, streaks, and aggregate stats (localStorage-backed)        */
/* ------------------------------------------------------------------ */

export type ActivityKind = "solve" | "attempt" | "lesson" | "review";

interface ActivityLog {
  /** Map of YYYY-MM-DD -> event count. */
  days: Record<string, number>;
  lastActive?: string;
}

function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function activityKey(): string {
  return `hasystor:${uid()}:activity`;
}

export function getActivityLog(): ActivityLog {
  try {
    const raw = localStorage.getItem(activityKey());
    return raw ? (JSON.parse(raw) as ActivityLog) : { days: {} };
  } catch {
    return { days: {} };
  }
}

export function recordActivity(_kind: ActivityKind): void {
  try {
    const log = getActivityLog();
    const key = todayKey();
    log.days[key] = (log.days[key] ?? 0) + 1;
    log.lastActive = key;
    localStorage.setItem(activityKey(), JSON.stringify(log));
  } catch {
    /* ignore quota */
  }
}

/** Current consecutive-day streak ending today or yesterday. */
export function currentStreak(log = getActivityLog()): number {
  let streak = 0;
  const d = new Date();
  // Allow the streak to count if today has no activity yet but yesterday did.
  if (!log.days[todayKey(d)]) d.setDate(d.getDate() - 1);
  for (;;) {
    if (log.days[todayKey(d)]) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

/** Longest streak ever recorded in the log. */
export function longestStreak(log = getActivityLog()): number {
  const keys = Object.keys(log.days).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of keys) {
    const cur = new Date(k + "T00:00:00Z");
    if (prev && (cur.getTime() - prev.getTime()) / 86400000 === 1) run++;
    else run = 1;
    best = Math.max(best, run);
    prev = cur;
  }
  return best;
}

/** Activity counts for the last `days` calendar days (oldest first). */
export function activityHeatmap(days = 84): { date: string; count: number }[] {
  const log = getActivityLog();
  const out: { date: string; count: number }[] = [];
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    const key = todayKey(d);
    out.push({ date: key, count: log.days[key] ?? 0 });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** Scan all localStorage progress for the current user. */
export function scanProgress(): {
  lessons: Record<string, LessonProgress>;
  problems: Record<string, ProblemProgress>;
} {
  const lessons: Record<string, LessonProgress> = {};
  const problems: Record<string, ProblemProgress> = {};
  try {
    const prefix = `hasystor:${uid()}:`;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(prefix)) continue;
      const rest = k.slice(prefix.length);
      const [kind, id] = [rest.slice(0, rest.indexOf(":")), rest.slice(rest.indexOf(":") + 1)];
      if (kind === "lesson") {
        const v = readLocal<LessonProgress>("lesson", id);
        if (v) lessons[id] = v;
      } else if (kind === "problem") {
        const v = readLocal<ProblemProgress>("problem", id);
        if (v) problems[id] = v;
      }
    }
  } catch {
    /* ignore */
  }
  return { lessons, problems };
}

/** Try to read durable lesson progress from Firestore (falls back to local). */
export async function fetchLessonProgress(lessonId: string): Promise<LessonProgress> {
  if (db && auth?.currentUser) {
    try {
      const snap = await getDoc(doc(db, "progress", uid(), "lessons", lessonId));
      if (snap.exists()) return snap.data() as LessonProgress;
    } catch {
      /* fall through */
    }
  }
  return getLessonProgress(lessonId);
}
