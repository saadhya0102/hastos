import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m1-ieee754",
  moduleId: "m1-data",
  title: "Floating Point: IEEE-754",
  order: 4,
  estMinutes: 30,
  objectives: [
    "Decode the sign, exponent, and mantissa fields of a float",
    "Explain the exponent bias and normalized vs subnormal values",
    "Identify the encodings of zero, infinity, and NaN",
    "Avoid floating-point equality and rounding pitfalls",
  ],
  prereqs: ["m1-bit-ops", "m1-unsigned-twos"],
  tags: ["ieee754", "representation", "floating-point"],
  sourceRefs: ["CS:APP §2.4"],
  triviaTags: ["ieee754-nan"],
  relatedProblems: ["m1-p-float-bits"],
});

export default meta;
