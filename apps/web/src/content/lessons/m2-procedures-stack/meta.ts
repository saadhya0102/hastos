import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m2-procedures-stack",
  moduleId: "m2-machine",
  title: "Procedures, the Stack, and the ABI",
  order: 3,
  estMinutes: 38,
  objectives: [
    "Trace how call and ret use the stack and return address",
    "Apply the System V AMD64 calling convention (argument registers, return value)",
    "Distinguish caller-saved from callee-saved registers",
    "Explain stack frames, the frame pointer, and the red zone",
  ],
  prereqs: ["m2-control-flow"],
  tags: ["x86-64", "assembly", "abi", "stack"],
  sourceRefs: ["CS:APP §3.7"],
  triviaTags: ["x86-64-abi", "stack-frame", "stack-grows-down"],
  relatedProblems: [],
});

export default meta;
