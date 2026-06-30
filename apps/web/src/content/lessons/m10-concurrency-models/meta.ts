import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m10-concurrency-models",
  moduleId: "m10-networking",
  title: "Server Concurrency Models",
  order: 4,
  estMinutes: 22,
  objectives: [
    "Compare process-per-connection, thread-per-connection, and event-driven servers",
    "Explain epoll/event loops and the C10k problem",
    "Reason about blocking vs non-blocking I/O",
  ],
  prereqs: ["m10-sockets", "m7-producer-consumer"],
  tags: ["networking", "concurrency"],
  sourceRefs: ["CS:APP §11.6, §12"],
  triviaTags: ["epoll-vs-select", "head-of-line"],
  relatedProblems: [],
});

export default meta;
