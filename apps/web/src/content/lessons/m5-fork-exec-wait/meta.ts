import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m5-fork-exec-wait",
  moduleId: "m5-processes",
  title: "Creating Processes: fork, exec, and wait",
  order: 2,
  estMinutes: 38,
  objectives: [
    "Use fork() and reason about its 'returns twice' behavior",
    "Predict the number of processes/prints from fork trees",
    "Replace a process image with exec",
    "Reap children with wait/waitpid and avoid zombies",
  ],
  prereqs: ["m5-processes"],
  tags: ["processes", "fork", "exec", "c"],
  sourceRefs: ["CS:APP §8.4"],
  triviaTags: ["zombie-process", "cow-fork"],
  relatedProblems: ["m5-p-fork-count"],
});

export default meta;
