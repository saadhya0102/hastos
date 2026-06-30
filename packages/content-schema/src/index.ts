import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Shared primitives                                                  */
/* ------------------------------------------------------------------ */

export const LanguageIdSchema = z.enum(["c", "cpp", "rust", "go", "asm", "python"]);
export const DifficultySchema = z.enum(["easy", "medium", "hard"]);
export const HintLevelSchema = z.enum(["nudge", "partial", "full"]);

/* ------------------------------------------------------------------ */
/* Lessons                                                            */
/* ------------------------------------------------------------------ */

export const LessonMetaSchema = z.object({
  id: z.string(),
  moduleId: z.string(),
  title: z.string(),
  order: z.number().int().nonnegative(),
  estMinutes: z.number().int().positive().optional(),
  objectives: z.array(z.string()).default([]),
  prereqs: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  sourceRefs: z.array(z.string()).default([]),
  triviaTags: z.array(z.string()).default([]),
  /**
   * Problem ids this lesson provides the necessary context for. Surfaced as a "Practice"
   * section so learners can immediately apply the theory. See PRD §16.
   */
  relatedProblems: z.array(z.string()).default([]),
});
export type LessonMeta = z.infer<typeof LessonMetaSchema>;

/* ------------------------------------------------------------------ */
/* Modules                                                            */
/* ------------------------------------------------------------------ */

export const ModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  order: z.number().int().nonnegative(),
  summary: z.string(),
  lessonIds: z.array(z.string()).default([]),
  problemIds: z.array(z.string()).default([]),
});
export type ModuleDef = z.infer<typeof ModuleSchema>;

export function defineModule(m: z.input<typeof ModuleSchema>): ModuleDef {
  return ModuleSchema.parse(m);
}

/* ------------------------------------------------------------------ */
/* Problems                                                           */
/* ------------------------------------------------------------------ */

export const ProblemFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  editable: z.boolean().default(true),
});

export const ProblemExampleSchema = z.object({
  title: z.string(),
  body: z.string(),
});

export const ProblemTestSchema = z.object({
  name: z.string(),
  visibility: z.enum(["sample", "hidden"]),
});

export const GradingModeSchema = z.enum([
  "stdout",
  "harness",
  "unit",
  "concurrency",
  "custom",
]);

export const ProblemLimitsSchema = z.object({
  cpuSec: z.number().positive().default(2),
  wallSec: z.number().positive().default(5),
  memoryKb: z.number().positive().default(131072),
});

export const ProblemHarnessSchema = z
  .object({
    /** Hidden driver/header files, by language. Assembled server-side only. */
    driverFiles: z.array(z.string()).default([]),
    sanitizers: z.array(z.enum(["tsan", "asan_ubsan", "none"])).default(["none"]),
    seeds: z.array(z.number().int()).default([1]),
  })
  .optional();

export const ProblemSchema = z.object({
  id: z.string(),
  title: z.string(),
  difficulty: DifficultySchema,
  topicTags: z.array(z.string()).default([]),
  moduleId: z.string().optional(),
  interview: z.boolean().default(false),
  allowedLanguages: z.array(LanguageIdSchema).min(1),
  /** Path (relative) to the statement MDX, or inline markdown. */
  statementMdx: z.string(),
  signatureNote: z.string().optional(),
  constraints: z.string().optional(),
  examples: z.array(ProblemExampleSchema).default([]),
  starterFiles: z.record(LanguageIdSchema, z.array(ProblemFileSchema)),
  gradingMode: GradingModeSchema,
  limits: ProblemLimitsSchema.default({}),
  harness: ProblemHarnessSchema,
  tests: z.array(ProblemTestSchema).default([]),
  followUps: z.array(z.string()).default([]),
  triviaTags: z.array(z.string()).default([]),
  hintsPolicy: z
    .object({ defaultLevel: HintLevelSchema.default("nudge"), allowFull: z.boolean().default(true) })
    .default({ defaultLevel: "nudge", allowFull: true }),
});
export type ProblemDef = z.infer<typeof ProblemSchema>;

export function defineProblem(p: z.input<typeof ProblemSchema>): ProblemDef {
  return ProblemSchema.parse(p);
}

/* ------------------------------------------------------------------ */
/* Trivia                                                             */
/* ------------------------------------------------------------------ */

export const TriviaSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  answer: z.string(),
  explanation: z.string().optional(),
  tags: z.array(z.string()).default([]),
  difficulty: DifficultySchema.default("medium"),
  sourceRef: z.string().optional(),
  /** Optional deep link to a lesson for "learn more". */
  lessonId: z.string().optional(),
});
export type TriviaFact = z.infer<typeof TriviaSchema>;

export function defineTrivia(facts: z.input<typeof TriviaSchema>[]): TriviaFact[] {
  return z.array(TriviaSchema).parse(facts);
}

/* ------------------------------------------------------------------ */
/* Knowledge checks (inline; rendered by MDX components)              */
/* ------------------------------------------------------------------ */

export const KnowledgeCheckSchema = z.object({
  id: z.string(),
  type: z.enum(["mcq", "multi", "boolean", "short", "numeric", "predict-output"]),
  prompt: z.string(),
  options: z.array(z.string()).optional(),
  answer: z.union([z.number(), z.string(), z.array(z.number()), z.boolean()]),
  tolerance: z.number().optional(),
  explanation: z.string().optional(),
});
export type KnowledgeCheckDef = z.infer<typeof KnowledgeCheckSchema>;
