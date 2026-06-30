import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m7-condvars",
  moduleId: "m7-concurrency",
  title: "Condition Variables and Semaphores",
  order: 2,
  estMinutes: 28,
  objectives: [
    "Use condition variables to wait for a predicate",
    "Explain why you must wait in a loop (spurious wakeups, lost wakeups)",
    "Use semaphores for counting and signaling",
    "Build a bounded buffer with a mutex and condition variables",
  ],
  prereqs: ["m7-mutex-spinlock"],
  tags: ["concurrency", "condition-variables", "semaphores", "c"],
  sourceRefs: ["CS:APP §12.5", "OSTEP condition variables"],
  triviaTags: ["lost-wakeup"],
  relatedProblems: ["m7-p-bounded-queue"],
});

export default meta;
