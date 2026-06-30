import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m2-registers-operands",
  moduleId: "m2-machine",
  title: "Registers and Operands",
  order: 0,
  estMinutes: 26,
  objectives: [
    "Name the x86-64 general-purpose registers and their sub-register forms",
    "Read the three operand types: immediate, register, and memory",
    "Decode memory operands with the base-index-scale-displacement form",
    "Translate between AT&T and Intel assembly syntax",
  ],
  prereqs: ["m1-unsigned-twos"],
  tags: ["x86-64", "assembly", "registers"],
  sourceRefs: ["CS:APP §3.1-3.4"],
  triviaTags: ["x86-64-abi", "stack-grows-down"],
  relatedProblems: [],
});

export default meta;
