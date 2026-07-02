import { allProblems, lessons, modules, lessonsForModule } from "@/lib/content";
import { getLessonProgress, getProblemProgress } from "@/lib/progress";

export interface ModuleStat {
  id: string;
  title: string;
  order: number;
  summary: string;
  lessonsTotal: number;
  lessonsDone: number;
  problemsTotal: number;
  problemsSolved: number;
  /** Combined 0..1 completion across lessons + problems. */
  completion: number;
}

export interface OverallStats {
  lessonsTotal: number;
  lessonsDone: number;
  problemsTotal: number;
  problemsSolved: number;
  problemsAttempted: number;
  easySolved: number;
  easyTotal: number;
  medSolved: number;
  medTotal: number;
  hardSolved: number;
  hardTotal: number;
  totalAttempts: number;
  estMinutesDone: number;
  estMinutesTotal: number;
  completion: number;
  perModule: ModuleStat[];
}

const lessonMinutes = (id: string): number => lessons[id]?.meta.estMinutes ?? 20;

/** Aggregate all progress into a single stats object for dashboards/profile. */
export function computeStats(): OverallStats {
  const lessonMetas = Object.values(lessons).map((l) => l.meta);
  const lessonsTotal = lessonMetas.length;
  const lessonsDone = lessonMetas.filter(
    (m) => getLessonProgress(m.id).status === "completed",
  ).length;

  let problemsSolved = 0;
  let problemsAttempted = 0;
  let totalAttempts = 0;
  let easySolved = 0;
  let medSolved = 0;
  let hardSolved = 0;
  let easyTotal = 0;
  let medTotal = 0;
  let hardTotal = 0;

  for (const p of allProblems) {
    if (p.difficulty === "easy") easyTotal++;
    else if (p.difficulty === "medium") medTotal++;
    else hardTotal++;
    const prog = getProblemProgress(p.id);
    totalAttempts += prog.attempts;
    if (prog.status === "solved") {
      problemsSolved++;
      if (p.difficulty === "easy") easySolved++;
      else if (p.difficulty === "medium") medSolved++;
      else hardSolved++;
    } else if (prog.status === "attempted") {
      problemsAttempted++;
    }
  }

  const estMinutesTotal = lessonMetas.reduce((s, m) => s + (m.estMinutes ?? 20), 0);
  const estMinutesDone = lessonMetas
    .filter((m) => getLessonProgress(m.id).status === "completed")
    .reduce((s, m) => s + lessonMinutes(m.id), 0);

  const perModule: ModuleStat[] = modules.map((m) => {
    const ls = lessonsForModule(m.id);
    const lessonsDoneM = ls.filter((l) => getLessonProgress(l.id).status === "completed").length;
    const probs = allProblems.filter((p) => p.moduleId === m.id);
    const solvedM = probs.filter((p) => getProblemProgress(p.id).status === "solved").length;
    const totalUnits = ls.length + probs.length;
    const doneUnits = lessonsDoneM + solvedM;
    return {
      id: m.id,
      title: m.title,
      order: m.order,
      summary: m.summary,
      lessonsTotal: ls.length,
      lessonsDone: lessonsDoneM,
      problemsTotal: probs.length,
      problemsSolved: solvedM,
      completion: totalUnits === 0 ? 0 : doneUnits / totalUnits,
    };
  });

  const totalUnits = lessonsTotal + allProblems.length;
  const doneUnits = lessonsDone + problemsSolved;

  return {
    lessonsTotal,
    lessonsDone,
    problemsTotal: allProblems.length,
    problemsSolved,
    problemsAttempted,
    easySolved,
    easyTotal,
    medSolved,
    medTotal,
    hardSolved,
    hardTotal,
    totalAttempts,
    estMinutesDone,
    estMinutesTotal,
    completion: totalUnits === 0 ? 0 : doneUnits / totalUnits,
    perModule,
  };
}

/** A learner "rank" derived from solved problems + completed lessons. */
export function rankFor(solved: number, lessonsDone: number): { name: string; next?: string; progress: number } {
  const score = solved * 3 + lessonsDone;
  const tiers = [
    { name: "Bootstrapper", at: 0 },
    { name: "Byte Wrangler", at: 10 },
    { name: "Pointer Adept", at: 30 },
    { name: "Concurrency Initiate", at: 60 },
    { name: "Systems Engineer", at: 100 },
    { name: "Kernel Hacker", at: 160 },
    { name: "Architect", at: 240 },
  ];
  let idx = 0;
  for (let i = 0; i < tiers.length; i++) if (score >= tiers[i].at) idx = i;
  const cur = tiers[idx];
  const next = tiers[idx + 1];
  const progress = next ? (score - cur.at) / (next.at - cur.at) : 1;
  return { name: cur.name, next: next?.name, progress: Math.max(0, Math.min(1, progress)) };
}
