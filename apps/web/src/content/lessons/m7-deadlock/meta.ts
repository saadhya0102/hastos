import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m7-deadlock",
  moduleId: "m7-concurrency",
  title: "Deadlock and Avoidance",
  order: 4,
  estMinutes: 30,
  objectives: [
    "State the four necessary conditions for deadlock",
    "Recognize the classic lock-ordering deadlock",
    "Apply lock ordering and other prevention strategies",
    "Distinguish deadlock from livelock and starvation",
  ],
  prereqs: ["m7-mutex-spinlock"],
  tags: ["concurrency", "deadlock"],
  sourceRefs: ["OSTEP concurrency bugs"],
  triviaTags: ["deadlock-conditions"],
  relatedProblems: [],
});

export default meta;
