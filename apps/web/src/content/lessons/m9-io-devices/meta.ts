import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m9-io-devices",
  moduleId: "m9-filesystems",
  title: "I/O Devices and the Storage Stack",
  order: 0,
  estMinutes: 32,
  objectives: [
    "Describe how the CPU talks to devices (registers, interrupts, DMA)",
    "Contrast polling with interrupts",
    "Compare HDD vs SSD performance characteristics",
  ],
  prereqs: ["m5-ecf"],
  tags: ["filesystems", "io", "os"],
  sourceRefs: ["OSTEP I/O devices, disks"],
  triviaTags: ["write-amplification"],
  relatedProblems: [],
});

export default meta;
