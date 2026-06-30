import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m3-cache-organization",
  moduleId: "m3-performance",
  title: "How Caches Work",
  order: 1,
  estMinutes: 30,
  objectives: [
    "Explain cache lines, sets, ways, tags, and valid bits",
    "Decompose an address into tag, set index, and block offset",
    "Distinguish direct-mapped, set-associative, and fully-associative caches",
    "Classify misses as compulsory, capacity, or conflict",
  ],
  prereqs: ["m3-latency-numbers"],
  tags: ["performance", "cache"],
  sourceRefs: ["CS:APP §6.2-6.4"],
  triviaTags: ["cache-line-64"],
  relatedProblems: ["m3-p-cache-sim"],
});

export default meta;
