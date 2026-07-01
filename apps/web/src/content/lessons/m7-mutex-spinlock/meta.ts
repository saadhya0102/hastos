import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m7-mutex-spinlock",
  moduleId: "m7-concurrency",
  title: "Mutexes and Spinlocks",
  order: 1,
  estMinutes: 36,
  objectives: [
    "Define the critical section and mutual exclusion",
    "Use a pthread mutex correctly",
    "Build a spinlock from an atomic test-and-set / CAS",
    "Compare spinning vs blocking and when to use each",
  ],
  prereqs: ["m7-threads-races"],
  tags: ["concurrency", "locks", "atomics", "c"],
  sourceRefs: ["CS:APP §12.5", "OSTEP locks"],
  triviaTags: ["mutex-vs-spinlock", "cas"],
  relatedProblems: ["m7-p-spinlock"],
});

export default meta;
