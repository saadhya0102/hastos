import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m12-capstone",
  moduleId: "m12-capstone",
  title: "Capstone: Putting It All Together",
  order: 0,
  estMinutes: 18,
  objectives: [
    "Synthesize the course modules into end-to-end systems",
    "Pick a capstone project that combines multiple subsystems",
    "Reason about how components interact under load",
  ],
  prereqs: ["m11-mvcc"],
  tags: ["capstone", "systems"],
  sourceRefs: [],
  triviaTags: [],
  relatedProblems: ["m12-p-hashmap"],
});

export default meta;
