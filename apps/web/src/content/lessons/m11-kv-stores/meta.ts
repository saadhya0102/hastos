import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m11-kv-stores",
  moduleId: "m11-storage",
  title: "Key-Value Stores and Indexing",
  order: 0,
  estMinutes: 30,
  objectives: [
    "Define the key-value model and core operations",
    "Explain why an index exists and read/write amplification",
    "Contrast read-optimized vs write-optimized designs",
  ],
  prereqs: ["m9-crash-consistency"],
  tags: ["storage", "databases"],
  sourceRefs: ["DDIA ch.3"],
  triviaTags: ["write-amplification"],
  relatedProblems: [],
});

export default meta;
