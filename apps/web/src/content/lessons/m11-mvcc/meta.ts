import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m11-mvcc",
  moduleId: "m11-storage",
  title: "MVCC and Isolation",
  order: 3,
  estMinutes: 22,
  objectives: [
    "Explain multi-version concurrency control",
    "Describe snapshot isolation",
    "Relate MVCC to transaction isolation levels",
  ],
  prereqs: ["m11-lsm", "m7-threads-races"],
  tags: ["storage", "databases", "concurrency"],
  sourceRefs: ["DDIA ch.7"],
  triviaTags: ["mvcc"],
  relatedProblems: [],
});

export default meta;
