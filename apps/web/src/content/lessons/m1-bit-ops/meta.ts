import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m1-bit-ops",
  moduleId: "m1-data",
  title: "Bit-Level Operations and Masks",
  order: 0,
  estMinutes: 32,
  objectives: [
    "Use the bitwise operators & | ^ ~ << >> correctly",
    "Build masks to set, clear, toggle, and test individual bits",
    "Distinguish logical from arithmetic shifts and avoid shift undefined behavior",
    "Apply essential bit idioms: lowest set bit, power-of-two test, popcount",
    "Pack and extract bit fields, and reason about operator precedence pitfalls",
  ],
  prereqs: ["m0-c-mental-model"],
  tags: ["bits", "masks", "c"],
  sourceRefs: ["CS:APP §2.1"],
  triviaTags: ["twos-complement", "endianness"],
  relatedProblems: ["ds-ring-buffer"],
});

export default meta;
