import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m9-buffer-cache",
  moduleId: "m9-filesystems",
  title: "The Buffer Cache and LRU",
  order: 2,
  estMinutes: 24,
  objectives: [
    "Explain why the OS caches disk blocks in RAM",
    "Implement LRU eviction conceptually",
    "Reason about write-back vs write-through",
    "Connect caching to replacement policies",
  ],
  prereqs: ["m9-files-inodes"],
  tags: ["filesystems", "cache", "lru"],
  sourceRefs: ["OSTEP file systems, caching"],
  triviaTags: ["clock-algo"],
  relatedProblems: ["m9-p-lru-cache", "m9-p-clock"],
});

export default meta;
