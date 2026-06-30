import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m3-locality",
  moduleId: "m3-performance",
  title: "Locality and Cache-Friendly Code",
  order: 2,
  estMinutes: 24,
  objectives: [
    "Define temporal and spatial locality",
    "Explain why row-major traversal beats column-major for C arrays",
    "Reason about stride and its effect on cache-line utilization",
    "Choose data layouts (AoS vs SoA) for access patterns",
  ],
  prereqs: ["m3-cache-organization"],
  tags: ["performance", "cache", "locality"],
  sourceRefs: ["CS:APP §6.5-6.6"],
  triviaTags: ["cache-line-64"],
  relatedProblems: ["m3-p-transpose"],
});

export default meta;
