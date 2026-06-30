import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m10-tcp-udp",
  moduleId: "m10-networking",
  title: "TCP vs. UDP",
  order: 2,
  estMinutes: 24,
  objectives: [
    "Contrast TCP's guarantees with UDP's best-effort model",
    "Explain the TCP handshake and teardown",
    "Reason about flow/congestion control and Nagle",
    "Choose the right transport for a workload",
  ],
  prereqs: ["m10-sockets"],
  tags: ["networking", "tcp", "udp"],
  sourceRefs: ["CS:APP §11", "TCP/IP Illustrated"],
  triviaTags: ["tcp-handshake", "nagle"],
  relatedProblems: [],
});

export default meta;
