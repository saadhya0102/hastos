import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m6-paging",
  moduleId: "m6-virtual-memory",
  title: "Pages, Page Tables, and the TLB",
  order: 1,
  estMinutes: 38,
  objectives: [
    "Split a virtual address into page number and offset",
    "Translate addresses through (multi-level) page tables",
    "Explain the TLB and why it matters for performance",
    "Reason about page faults and demand paging",
  ],
  prereqs: ["m6-address-space"],
  tags: ["virtual-memory", "paging", "tlb"],
  sourceRefs: ["CS:APP §9.3-9.6"],
  triviaTags: ["page-size-4k", "tlb"],
  relatedProblems: [],
});

export default meta;
