import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m8-proportional",
  moduleId: "m8-scheduling",
  title: "Proportional-Share Scheduling",
  order: 3,
  estMinutes: 18,
  objectives: [
    "Explain lottery and stride scheduling",
    "Reason about fairness over time",
    "Connect proportional share to modern fair schedulers",
  ],
  prereqs: ["m8-scheduling-basics"],
  tags: ["scheduling", "os"],
  sourceRefs: ["OSTEP lottery/stride"],
  triviaTags: [],
  relatedProblems: [],
});

export default meta;
