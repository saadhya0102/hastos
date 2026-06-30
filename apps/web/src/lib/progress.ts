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
  const next: ProblemProgress = {
    status: solved ? "solved" : current.status === "solved" ? "solved" : "attempted",
    testsPassed: Math.max(current.testsPassed, result.testsPassed),
    testsTotal: result.testsTotal,
    attempts: current.attempts + 1,
  };
  writeLocal("problem", problemId, next);
  await writeFirestore(["progress", uid(), "problems", problemId], {
    ...next,
    bestVerdict: result.verdict,
  });
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
