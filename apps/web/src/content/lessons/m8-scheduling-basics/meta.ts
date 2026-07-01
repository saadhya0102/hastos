import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m8-scheduling-basics",
  moduleId: "m8-scheduling",
  title: "CPU Scheduling: FIFO, SJF, and Round Robin",
  order: 1,
  estMinutes: 42,
  objectives: [
    "Define turnaround time and response time",
    "Analyze FIFO and the convoy effect",
    "Explain SJF/STCF and why they optimize turnaround",
    "Analyze Round Robin and the quantum trade-off",
  ],
  prereqs: ["m8-lde"],
  tags: ["scheduling", "os"],
  sourceRefs: ["OSTEP scheduling"],
  triviaTags: ["convoy-effect", "rr-quantum"],
  relatedProblems: ["m8-p-fifo-turnaround", "m8-p-rr-order"],
});

export default meta;
