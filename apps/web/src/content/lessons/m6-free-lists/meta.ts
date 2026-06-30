import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m6-free-lists",
  moduleId: "m6-virtual-memory",
  title: "Implementing malloc: Free Lists and Coalescing",
  order: 4,
  estMinutes: 34,
  objectives: [
    "Implement an implicit free list with boundary tags",
    "Split blocks on allocation and coalesce on free",
    "Upgrade to an explicit free list of free blocks",
    "Understand segregated free lists for speed",
  ],
  prereqs: ["m6-allocators-intro"],
  tags: ["memory", "allocator", "free-list", "c"],
  sourceRefs: ["CS:APP §9.9"],
  triviaTags: ["internal-vs-external-frag", "malloc-alignment"],
  relatedProblems: ["m6-p-pool"],
});

export default meta;
