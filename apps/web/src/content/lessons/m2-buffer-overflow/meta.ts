import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m2-buffer-overflow",
  moduleId: "m2-machine",
  title: "Memory Layout, Buffer Overflows, and Defenses",
  order: 4,
  estMinutes: 32,
  objectives: [
    "Explain how a stack buffer overflow can overwrite the return address",
    "Describe classic exploitation (code injection, return-oriented programming)",
    "Identify the standard defenses: stack canaries, NX/DEP, ASLR, PIE",
    "Write overflow-safe code and reason about why sanitizers catch these bugs",
  ],
  prereqs: ["m2-procedures-stack"],
  tags: ["x86-64", "security", "memory-safety"],
  sourceRefs: ["CS:APP §3.10"],
  triviaTags: ["stack-frame"],
  relatedProblems: ["m0-p-memcpy"],
});

export default meta;
