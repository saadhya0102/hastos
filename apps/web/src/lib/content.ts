import type { ComponentType } from "react";
import type { LessonMeta, ModuleDef, ProblemDef, TriviaFact } from "@hasystor/content-schema";
import { modules as moduleDefs } from "@/content/modules";

type MdxLoader = () => Promise<{ default: ComponentType }>;

/* ---------------- Lessons ---------------- */

const lessonMetas = import.meta.glob<LessonMeta>("../content/lessons/*/meta.ts", {
  eager: true,
  import: "default",
});
const lessonComponents = import.meta.glob("../content/lessons/*/lesson.mdx") as Record<
  string,
  MdxLoader
>;

function idFromPath(path: string): string {
  // ../content/lessons/<id>/meta.ts  ->  <id>
  const m = path.match(/lessons\/([^/]+)\//);
  return m ? m[1] : path;
}

export interface LessonEntry {
  meta: LessonMeta;
  load: MdxLoader;
}

export const lessons: Record<string, LessonEntry> = {};
for (const [path, meta] of Object.entries(lessonMetas)) {
  const id = idFromPath(path);
  const compPath = Object.keys(lessonComponents).find((p) => idFromPath(p) === id);
  if (compPath) lessons[id] = { meta, load: lessonComponents[compPath] };
}

export function getLesson(id: string): LessonEntry | undefined {
  return lessons[id];
}

export function lessonsForModule(moduleId: string): LessonMeta[] {
  return Object.values(lessons)
    .map((l) => l.meta)
    .filter((m) => m.moduleId === moduleId)
    .sort((a, b) => a.order - b.order);
}

/* ---------------- Problems ---------------- */

const problemSpecs = import.meta.glob<ProblemDef>("../content/problems/*/spec.ts", {
  eager: true,
  import: "default",
});
const problemStatements = import.meta.glob("../content/problems/*/statement.mdx") as Record<
  string,
  MdxLoader
>;

function problemIdFromPath(path: string): string {
  const m = path.match(/problems\/([^/]+)\//);
  return m ? m[1] : path;
}

export interface ProblemEntry {
  spec: ProblemDef;
  loadStatement?: MdxLoader;
}

export const problems: Record<string, ProblemEntry> = {};
for (const [path, spec] of Object.entries(problemSpecs)) {
  const id = problemIdFromPath(path);
  const stmtPath = Object.keys(problemStatements).find((p) => problemIdFromPath(p) === id);
  problems[id] = { spec, loadStatement: stmtPath ? problemStatements[stmtPath] : undefined };
}

export function getProblem(id: string): ProblemEntry | undefined {
  return problems[id];
}

export const allProblems: ProblemDef[] = Object.values(problems).map((p) => p.spec);

export const interviewProblems: ProblemDef[] = allProblems.filter((p) => p.interview);

/* ---------------- Modules ---------------- */

export const modules: ModuleDef[] = [...moduleDefs].sort((a, b) => a.order - b.order);

export function getModule(id: string): ModuleDef | undefined {
  return modules.find((m) => m.id === id);
}

/* ---------------- Trivia ---------------- */

const triviaModules = import.meta.glob<TriviaFact[]>("../content/trivia/*.ts", {
  eager: true,
  import: "default",
});

export const triviaBank: TriviaFact[] = Object.values(triviaModules).flat();

const seenThisSession = new Set<string>();

/** Random trivia fact, de-duplicated within a session; optionally weighted by tag. */
export function randomTrivia(preferTags: string[] = []): TriviaFact | undefined {
  if (triviaBank.length === 0) return undefined;
  let pool = triviaBank.filter((t) => !seenThisSession.has(t.id));
  if (pool.length === 0) {
    seenThisSession.clear();
    pool = triviaBank;
  }
  if (preferTags.length) {
    const tagged = pool.filter((t) => t.tags.some((tag) => preferTags.includes(tag)));
    if (tagged.length) pool = tagged;
  }
  const fact = pool[Math.floor(Math.random() * pool.length)];
  seenThisSession.add(fact.id);
  return fact;
}
