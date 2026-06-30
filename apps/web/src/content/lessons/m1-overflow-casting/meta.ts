import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m1-overflow-casting",
  moduleId: "m1-data",
  title: "Integer Overflow and Casting Pitfalls",
  order: 2,
  estMinutes: 26,
  objectives: [
    "Explain why signed overflow is undefined while unsigned overflow wraps",
    "Predict the result of truncation and integer promotion",
    "Detect overflow safely before it happens",
    "Recognize real-world bugs and security holes caused by overflow",
  ],
  prereqs: ["m1-unsigned-twos"],
  tags: ["overflow", "casting", "ub", "c"],
  sourceRefs: ["CS:APP §2.3"],
  triviaTags: ["signed-overflow-ub"],
  relatedProblems: ["m1-p-saturating-add"],
});

export default meta;
