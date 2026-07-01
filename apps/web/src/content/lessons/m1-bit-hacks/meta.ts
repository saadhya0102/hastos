import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m1-bit-hacks",
  moduleId: "m1-data",
  title: "Bit Hacks: Reverse, Parity, CLZ, and Powers of Two",
  order: 5,
  estMinutes: 26,
  objectives: [
    "Reverse the bits of a word and compute parity",
    "Count leading/trailing zeros and relate them to log2",
    "Round up to the next power of two",
    "Convert binary to Gray code and see where these tricks are used",
  ],
  prereqs: ["m1-bit-ops"],
  tags: ["bits", "c", "bit-hacks"],
  sourceRefs: ["CS:APP §2 (DataLab)", "Hacker's Delight"],
  triviaTags: ["twos-complement"],
  relatedProblems: ["m1-p-reverse-bits", "m1-p-parity", "m1-p-clz", "m1-p-next-pow2", "m1-p-binary-to-gray"],
});

export default meta;
