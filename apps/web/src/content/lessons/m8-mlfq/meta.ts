import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m8-mlfq",
  moduleId: "m8-scheduling",
  title: "Multi-Level Feedback Queue (MLFQ)",
  order: 2,
  estMinutes: 22,
  objectives: [
    "Explain how MLFQ approximates SJF without knowing job lengths",
    "State the MLFQ rules for priority and demotion",
    "Describe gaming and the periodic priority boost",
  ],
  prereqs: ["m8-scheduling-basics"],
  tags: ["scheduling", "os"],
  sourceRefs: ["OSTEP MLFQ"],
  triviaTags: ["mlfq"],
  relatedProblems: [],
});

export default meta;
