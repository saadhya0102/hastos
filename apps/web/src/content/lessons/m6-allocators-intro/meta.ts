import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m6-allocators-intro",
  moduleId: "m6-virtual-memory",
  title: "Dynamic Allocation and Fragmentation",
  order: 3,
  estMinutes: 30,
  objectives: [
    "Explain what a heap allocator does and the malloc/free contract",
    "Distinguish internal from external fragmentation",
    "Reason about alignment and minimum block sizes",
    "Compare placement policies (first-fit, best-fit)",
  ],
  prereqs: ["m6-demand-mmap"],
  tags: ["memory", "allocator", "fragmentation"],
  sourceRefs: ["CS:APP §9.9"],
  triviaTags: ["malloc-alignment", "internal-vs-external-frag"],
  relatedProblems: [],
});

export default meta;
