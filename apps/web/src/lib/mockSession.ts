/**
 * A "mock interview" coding session persists across pages (so the countdown keeps running
 * while the learner works in the IDE). Stored in localStorage; the timer bar reads it.
 */
export interface MockSession {
  mode: "coding";
  problemIds: string[];
  startedAt: number;
  endsAt: number;
}

const KEY = "hastos:mock-session";
export const MOCK_DURATION_SEC = 60 * 60; // one hour

export function startMockSession(problemIds: string[], durationSec = MOCK_DURATION_SEC): MockSession {
  const now = Date.now();
  const session: MockSession = {
    mode: "coding",
    problemIds,
    startedAt: now,
    endsAt: now + durationSec * 1000,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
  return session;
}

export function getMockSession(): MockSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MockSession) : null;
  } catch {
    return null;
  }
}

export function endMockSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
