import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m5-signals",
  moduleId: "m5-processes",
  title: "Signals and Async-Safety",
  order: 3,
  estMinutes: 34,
  objectives: [
    "Explain signals as asynchronous software interrupts",
    "Install handlers and reason about when they run",
    "Apply async-signal-safety rules (and what breaks them)",
    "Handle EINTR and use sig_atomic_t correctly",
  ],
  prereqs: ["m5-fork-exec-wait"],
  tags: ["signals", "processes", "concurrency"],
  sourceRefs: ["CS:APP §8.5"],
  triviaTags: ["async-signal-safe", "EINTR"],
  relatedProblems: [],
});

export default meta;
