import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m1-unsigned-twos",
  moduleId: "m1-data",
  title: "Unsigned and Two's Complement",
  order: 1,
  estMinutes: 28,
  objectives: [
    "Convert between unsigned and two's complement representations",
    "Reason about the value ranges of fixed-width integer types",
    "Explain why negation is ~x + 1 and how subtraction reuses addition",
    "Avoid the classic signed/unsigned comparison pitfalls",
  ],
  prereqs: ["m1-bit-ops"],
  tags: ["representation", "twos-complement", "c"],
  sourceRefs: ["CS:APP §2.2-2.3"],
  triviaTags: ["twos-complement"],
  relatedProblems: ["m1-p-saturating-add"],
});

export default meta;
