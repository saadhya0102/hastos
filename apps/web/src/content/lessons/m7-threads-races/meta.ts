import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m7-threads-races",
  moduleId: "m7-concurrency",
  title: "Threads, Shared State, and Data Races",
  order: 0,
  estMinutes: 26,
  objectives: [
    "Create threads and share memory between them",
    "Define a data race and why it is undefined behavior",
    "See how a non-atomic counter loses updates",
    "Use atomics to make a counter correct",
  ],
  prereqs: ["m5-processes"],
  tags: ["concurrency", "threads", "atomics", "c"],
  sourceRefs: ["CS:APP §12.1-12.4", "OSTEP concurrency"],
  triviaTags: ["volatile-not-atomic"],
  relatedProblems: ["m7-p-spinlock"],
});

export default meta;
