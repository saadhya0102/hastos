import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m5-pipes-shell",
  moduleId: "m5-processes",
  title: "Pipes and Building a Tiny Shell",
  order: 4,
  estMinutes: 34,
  objectives: [
    "Explain file descriptors and the role of dup2",
    "Use pipe() to connect two processes",
    "Assemble fork + exec + wait + pipe into a shell that runs a | b",
    "Understand why both ends of a pipe must be closed properly",
  ],
  prereqs: ["m5-signals"],
  tags: ["processes", "pipes", "shell", "c"],
  sourceRefs: ["CS:APP §8.4, §10"],
  triviaTags: [],
  relatedProblems: ["m5-p-fork-count"],
});

export default meta;
