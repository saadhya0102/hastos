import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m11-btree",
  moduleId: "m11-storage",
  title: "B-Trees",
  order: 1,
  estMinutes: 28,
  objectives: [
    "Explain B-tree structure and why high fanout keeps it shallow",
    "Trace search within and across nodes",
    "Describe insertion with node splitting",
    "Connect B-trees to disk/page-oriented storage",
  ],
  prereqs: ["m11-kv-stores"],
  tags: ["storage", "databases", "b-tree"],
  sourceRefs: ["DDIA ch.3", "CLRS B-trees"],
  triviaTags: ["b-tree-fanout"],
  relatedProblems: ["m11-p-btree-search"],
});

export default meta;
