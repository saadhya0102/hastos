import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m2-data-arithmetic",
  moduleId: "m2-machine",
  title: "Data Movement and Arithmetic",
  order: 1,
  estMinutes: 24,
  objectives: [
    "Use mov and its sign/zero-extending variants",
    "Distinguish lea (address computation) from mov (memory access)",
    "Map C arithmetic and logical operators to instructions",
    "Recognize how compilers use lea for fast multiply-add",
  ],
  prereqs: ["m2-registers-operands"],
  tags: ["x86-64", "assembly", "arithmetic"],
  sourceRefs: ["CS:APP §3.5"],
  triviaTags: [],
  relatedProblems: [],
});

export default meta;
