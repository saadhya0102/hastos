import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m12-interview-guide",
  moduleId: "m12-capstone",
  title: "Acing Systems Interviews",
  order: 1,
  estMinutes: 20,
  objectives: [
    "Know the canonical systems-implementation problems and where to practice them",
    "Structure your approach: clarify, design, implement, test, discuss trade-offs",
    "Communicate complexity and trade-offs like a senior engineer",
  ],
  prereqs: ["m12-capstone"],
  tags: ["interview", "career"],
  sourceRefs: [],
  triviaTags: ["aba-problem", "false-sharing"],
  relatedProblems: ["m7-p-lockfree-mpsc", "m6-p-pool", "m9-p-lru-cache"],
});

export default meta;
