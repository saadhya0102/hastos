import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m3-latency-numbers",
  moduleId: "m3-performance",
  title: "Latency Numbers and the Cost Model",
  order: 0,
  estMinutes: 26,
  objectives: [
    "Internalize the relative latencies of registers, caches, DRAM, SSD, and network",
    "Use the cost model to reason about where time goes",
    "Explain why memory access — not arithmetic — usually dominates performance",
  ],
  prereqs: [],
  tags: ["performance", "memory-hierarchy"],
  sourceRefs: ["CS:APP §5-6", "Latency Numbers Every Programmer Should Know"],
  triviaTags: ["latency-numbers", "cache-line-64"],
  relatedProblems: [],
});

export default meta;
