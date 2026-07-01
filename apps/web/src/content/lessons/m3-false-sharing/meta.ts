import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m3-false-sharing",
  moduleId: "m3-performance",
  title: "False Sharing",
  order: 4,
  estMinutes: 26,
  objectives: [
    "Explain cache coherence at the line granularity",
    "Diagnose false sharing between threads",
    "Fix it with padding/alignment to separate cache lines",
  ],
  prereqs: ["m3-cache-organization"],
  tags: ["performance", "cache", "concurrency"],
  sourceRefs: ["CS:APP §6", "OSTEP concurrency"],
  triviaTags: ["false-sharing", "cache-line-64"],
  relatedProblems: [],
});

export default meta;
