import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m7-producer-consumer",
  moduleId: "m7-concurrency",
  title: "Producer/Consumer and Thread Pools",
  order: 3,
  estMinutes: 24,
  objectives: [
    "Apply the producer/consumer pattern to decouple work",
    "Design a thread pool with a shared work queue",
    "Handle graceful shutdown and draining",
    "Reason about pool sizing",
  ],
  prereqs: ["m7-condvars"],
  tags: ["concurrency", "thread-pool", "c"],
  sourceRefs: ["OSTEP concurrency"],
  triviaTags: [],
  relatedProblems: ["m7-p-thread-pool"],
});

export default meta;
