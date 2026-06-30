import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m0-c-mental-model",
  moduleId: "m0-orientation",
  title: "The C Mental Model: Memory, Pointers, and Undefined Behavior",
  order: 1,
  estMinutes: 35,
  objectives: [
    "Reason about memory as a flat array of bytes with addresses",
    "Use pointers confidently: address-of, dereference, and pointer arithmetic",
    "Understand how arrays decay to pointers and how strings are represented",
    "Recognize common sources of undefined behavior and why they are dangerous",
  ],
  prereqs: ["m0-what-is-systems"],
  tags: ["c", "pointers", "memory", "undefined-behavior"],
  sourceRefs: ["CS:APP §1-2", "K&R"],
  triviaTags: ["malloc-alignment", "stack-grows-down", "signed-overflow-ub"],
  relatedProblems: ["m0-p-strlen", "m0-p-memcpy"],
});

export default meta;
