import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m6-address-space",
  moduleId: "m6-virtual-memory",
  title: "The Address Space Illusion",
  order: 0,
  estMinutes: 20,
  objectives: [
    "Explain why virtual memory exists and the problems it solves",
    "Describe the layout of a process's virtual address space",
    "Distinguish virtual from physical addresses",
    "Explain protection and isolation between processes",
  ],
  prereqs: ["m5-processes"],
  tags: ["virtual-memory", "os"],
  sourceRefs: ["CS:APP §9.1-9.2", "OSTEP VM intro"],
  triviaTags: ["stack-grows-down"],
  relatedProblems: [],
});

export default meta;
