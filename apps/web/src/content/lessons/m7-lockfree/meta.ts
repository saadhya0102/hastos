import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m7-lockfree",
  moduleId: "m7-concurrency",
  title: "Lock-Free Programming and the ABA Problem",
  order: 6,
  estMinutes: 32,
  objectives: [
    "Define lock-free and its progress guarantees",
    "Build a CAS loop and a Treiber stack",
    "Explain the ABA problem and how to mitigate it",
    "Understand the single-consumer simplification used in an MPSC queue",
  ],
  prereqs: ["m7-memory-model", "m7-condvars"],
  tags: ["concurrency", "lock-free", "atomics", "c"],
  sourceRefs: ["The Art of Multiprocessor Programming"],
  triviaTags: ["aba-problem", "memory-ordering", "cas"],
  relatedProblems: ["m7-p-lockfree-mpsc"],
});

export default meta;
