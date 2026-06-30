import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m0-toolchain",
  moduleId: "m0-orientation",
  title: "From Source to a Running Program: The Toolchain",
  order: 2,
  estMinutes: 24,
  objectives: [
    "Describe the four stages: preprocess, compile, assemble, link",
    "Explain the difference between compile-time and link-time errors",
    "Read common compiler and linker error messages",
    "Understand optimization levels and warning flags",
  ],
  prereqs: ["m0-c-mental-model"],
  tags: ["toolchain", "compiler", "linker", "c"],
  sourceRefs: ["CS:APP §1.2, §7"],
  triviaTags: ["static-vs-dynamic-link", "sanitizers"],
  relatedProblems: ["m0-p-strlen"],
});

export default meta;
