import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m5-processes",
  moduleId: "m5-processes",
  title: "Processes and Context Switches",
  order: 1,
  estMinutes: 26,
  objectives: [
    "Define a process and the illusions it provides",
    "Explain the process control block and process states",
    "Describe a context switch and its cost",
    "Distinguish concurrency from parallelism",
  ],
  prereqs: ["m5-ecf"],
  tags: ["processes", "os"],
  sourceRefs: ["CS:APP §8.2", "OSTEP processes"],
  triviaTags: [],
  relatedProblems: [],
});

export default meta;
