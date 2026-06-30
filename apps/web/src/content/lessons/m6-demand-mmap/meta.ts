import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m6-demand-mmap",
  moduleId: "m6-virtual-memory",
  title: "Demand Paging, mmap, and Copy-on-Write",
  order: 2,
  estMinutes: 22,
  objectives: [
    "Explain memory mapping with mmap and memory-mapped files",
    "Describe copy-on-write and how it makes fork cheap",
    "Reason about swapping and thrashing",
    "Connect these OS tricks back to page faults",
  ],
  prereqs: ["m6-paging"],
  tags: ["virtual-memory", "mmap", "cow"],
  sourceRefs: ["CS:APP §9.8", "OSTEP paging"],
  triviaTags: ["cow-fork", "page-size-4k"],
  relatedProblems: [],
});

export default meta;
