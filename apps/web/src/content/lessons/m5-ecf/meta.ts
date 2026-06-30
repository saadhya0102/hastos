import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m5-ecf",
  moduleId: "m5-processes",
  title: "Exceptional Control Flow: Exceptions, Interrupts, Traps",
  order: 0,
  estMinutes: 20,
  objectives: [
    "Define exceptional control flow and why it exists",
    "Classify exceptions: interrupts, traps, faults, and aborts",
    "Explain user vs kernel mode and the mode switch",
    "Connect system calls to traps",
  ],
  prereqs: ["m2-procedures-stack"],
  tags: ["ecf", "os", "exceptions"],
  sourceRefs: ["CS:APP §8.1"],
  triviaTags: [],
  relatedProblems: [],
});

export default meta;
