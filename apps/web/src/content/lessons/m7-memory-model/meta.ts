import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m7-memory-model",
  moduleId: "m7-concurrency",
  title: "Memory Models and Ordering",
  order: 5,
  estMinutes: 28,
  objectives: [
    "Explain why compilers and CPUs reorder memory operations",
    "Define sequential consistency as the intuitive baseline",
    "Use acquire/release ordering to build correct synchronization",
    "Choose memory orders deliberately (relaxed vs acquire/release vs seq_cst)",
  ],
  prereqs: ["m7-mutex-spinlock"],
  tags: ["concurrency", "memory-model", "atomics"],
  sourceRefs: ["C11 memory model", "OSTEP"],
  triviaTags: ["memory-ordering"],
  relatedProblems: ["m7-p-lockfree-mpsc"],
});

export default meta;
