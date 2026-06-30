import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m0-what-is-systems",
  moduleId: "m0-orientation",
  title: "What Is Systems Programming?",
  order: 0,
  estMinutes: 16,
  objectives: [
    "Define systems programming and contrast it with application programming",
    "Map the stack of abstractions from hardware up to your code",
    "Explain why low-level understanding matters: performance, correctness, security, control",
  ],
  prereqs: [],
  tags: ["orientation", "mental-model"],
  sourceRefs: ["CS:APP §1", "OSTEP Intro"],
  triviaTags: ["latency-numbers"],
  relatedProblems: [],
});

export default meta;
