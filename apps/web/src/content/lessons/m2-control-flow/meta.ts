import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m2-control-flow",
  moduleId: "m2-machine",
  title: "Control Flow and Condition Codes",
  order: 2,
  estMinutes: 34,
  objectives: [
    "Explain how cmp/test set condition flags",
    "Map if/else, loops, and switch to jumps",
    "Read conditional jump mnemonics (je, jl, jb, ...) and their signed/unsigned distinction",
    "Recognize conditional moves (cmov) and why compilers use them",
  ],
  prereqs: ["m2-data-arithmetic"],
  tags: ["x86-64", "assembly", "control-flow"],
  sourceRefs: ["CS:APP §3.6"],
  triviaTags: ["condition-codes"],
  relatedProblems: ["m2-p-branchless-abs", "m2-p-conditional-select"],
});

export default meta;
