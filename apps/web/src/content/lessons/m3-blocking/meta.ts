import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m3-blocking",
  moduleId: "m3-performance",
  title: "Loop Tiling (Blocking)",
  order: 3,
  estMinutes: 22,
  objectives: [
    "Explain why naive matrix multiply thrashes the cache",
    "Apply blocking/tiling so a working set fits in cache",
    "Reason about reuse and the arithmetic intensity of a kernel",
  ],
  prereqs: ["m3-locality"],
  tags: ["performance", "cache", "blocking"],
  sourceRefs: ["CS:APP §6.6"],
  triviaTags: ["cache-line-64"],
  relatedProblems: [],
});

export default meta;
