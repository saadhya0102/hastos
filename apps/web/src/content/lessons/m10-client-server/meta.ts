import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m10-client-server",
  moduleId: "m10-networking",
  title: "The Client-Server Model",
  order: 0,
  estMinutes: 24,
  objectives: [
    "Explain the client-server model and roles",
    "Describe IP addresses, ports, and the protocol stack",
    "Understand how a connection is identified (the 5-tuple)",
  ],
  prereqs: ["m5-pipes-shell"],
  tags: ["networking"],
  sourceRefs: ["CS:APP §11"],
  triviaTags: [],
  relatedProblems: [],
});

export default meta;
