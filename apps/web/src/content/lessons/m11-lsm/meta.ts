import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m11-lsm",
  moduleId: "m11-storage",
  title: "LSM-Trees and Compaction",
  order: 2,
  estMinutes: 26,
  objectives: [
    "Describe the LSM write path: memtable, flush, SSTables",
    "Explain the read path and bloom filters",
    "Explain compaction and the merge of sorted runs",
    "Compare LSM trade-offs to B-trees",
  ],
  prereqs: ["m11-btree"],
  tags: ["storage", "databases", "lsm"],
  sourceRefs: ["DDIA ch.3", "LevelDB/RocksDB"],
  triviaTags: ["lsm-compaction", "write-amplification"],
  relatedProblems: ["m11-p-lsm-merge"],
});

export default meta;
