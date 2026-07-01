import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m4-translation-units",
  moduleId: "m4-linking",
  title: "Translation Units, Declarations, and Definitions",
  order: 0,
  estMinutes: 30,
  objectives: [
    "Define a translation unit and how the compiler processes one at a time",
    "Distinguish declarations from definitions and apply the one-definition rule",
    "Explain why headers contain declarations and .c files contain definitions",
    "Read compile-time vs link-time errors correctly",
  ],
  prereqs: ["m0-toolchain"],
  tags: ["linking", "compiler", "c"],
  sourceRefs: ["CS:APP §7.1-7.3"],
  triviaTags: ["static-vs-dynamic-link"],
  relatedProblems: [],
});

export default meta;
