import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m0-structs",
  moduleId: "m0-orientation",
  title: "Structs, Unions, and Alignment",
  order: 4,
  estMinutes: 32,
  objectives: [
    "Lay out struct fields and compute size with padding",
    "Explain alignment requirements and why padding exists",
    "Reorder fields to shrink a struct",
    "Understand unions and type punning caveats",
  ],
  prereqs: ["m0-c-mental-model"],
  tags: ["c", "structs", "alignment", "memory"],
  sourceRefs: ["Dive Into Systems ch.2", "CS:APP §3.9"],
  triviaTags: ["malloc-alignment"],
  relatedProblems: ["m0-p-memset"],
});

export default meta;
