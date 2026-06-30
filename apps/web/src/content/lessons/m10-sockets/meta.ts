import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m10-sockets",
  moduleId: "m10-networking",
  title: "The Socket API",
  order: 1,
  estMinutes: 22,
  objectives: [
    "List the socket calls for servers and clients in order",
    "Explain that sockets are file descriptors",
    "Reason about partial reads/writes and framing",
  ],
  prereqs: ["m10-client-server"],
  tags: ["networking", "sockets"],
  sourceRefs: ["CS:APP §11.4"],
  triviaTags: [],
  relatedProblems: ["m10-p-checksum"],
});

export default meta;
