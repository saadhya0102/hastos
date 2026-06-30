import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m9-files-inodes",
  moduleId: "m9-filesystems",
  title: "Files, Directories, and Inodes",
  order: 1,
  estMinutes: 26,
  objectives: [
    "Explain what an inode stores and what it does not",
    "Trace path resolution through directories",
    "Describe hard links vs symbolic links",
    "Understand direct/indirect block pointers",
  ],
  prereqs: ["m9-io-devices"],
  tags: ["filesystems", "inodes", "os"],
  sourceRefs: ["OSTEP file systems"],
  triviaTags: ["inode"],
  relatedProblems: [],
});

export default meta;
