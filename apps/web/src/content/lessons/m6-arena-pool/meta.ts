import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m6-arena-pool",
  moduleId: "m6-virtual-memory",
  title: "Arena and Pool Allocators",
  order: 5,
  estMinutes: 32,
  objectives: [
    "Implement a bump (arena) allocator and know when it wins",
    "Implement a fixed-size pool/slab allocator with an O(1) free list",
    "Compare specialized allocators to general malloc",
    "Reason about alignment in custom allocators",
  ],
  prereqs: ["m6-free-lists"],
  tags: ["memory", "allocator", "arena", "pool", "c"],
  sourceRefs: ["CS:APP §9.9", "slab allocator"],
  triviaTags: ["malloc-alignment"],
  relatedProblems: ["m6-p-arena", "m6-p-pool"],
});

export default meta;
