import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m4-symbols",
  moduleId: "m4-linking",
  title: "Symbols: Strong, Weak, and Resolution",
  order: 1,
  estMinutes: 24,
  objectives: [
    "Define symbols and the symbol table in object files",
    "Distinguish strong from weak symbols",
    "Apply the linker's rules for resolving multiple definitions",
    "Predict the outcome of common symbol-resolution scenarios",
  ],
  prereqs: ["m4-translation-units"],
  tags: ["linking", "symbols"],
  sourceRefs: ["CS:APP §7.5-7.6"],
  triviaTags: ["strong-weak-symbols"],
  relatedProblems: ["m4-p-symbol-resolve"],
});

export default meta;
