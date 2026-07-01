import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m9-crash-consistency",
  moduleId: "m9-filesystems",
  title: "Journaling and Crash Consistency",
  order: 3,
  estMinutes: 36,
  objectives: [
    "Explain the crash-consistency problem with multi-block updates",
    "Describe write-ahead logging / journaling",
    "Distinguish ordered vs data journaling",
    "Explain fsync and durability guarantees",
  ],
  prereqs: ["m9-buffer-cache"],
  tags: ["filesystems", "journaling", "durability"],
  sourceRefs: ["OSTEP journaling, crash consistency"],
  triviaTags: ["journaling", "fsync"],
  relatedProblems: [],
});

export default meta;
