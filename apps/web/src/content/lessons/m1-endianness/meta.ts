import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m1-endianness",
  moduleId: "m1-data",
  title: "Byte Ordering: Endianness",
  order: 3,
  estMinutes: 22,
  objectives: [
    "Define big-endian and little-endian byte orders",
    "Detect a machine's endianness at runtime",
    "Swap byte order and explain network byte order",
    "Understand why endianness matters for files, networks, and casts",
  ],
  prereqs: ["m1-unsigned-twos"],
  tags: ["representation", "endianness", "networking"],
  sourceRefs: ["CS:APP §2.1"],
  triviaTags: ["endianness"],
  relatedProblems: ["m1-p-bswap32"],
});

export default meta;
