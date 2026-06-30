import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m8-lde",
  moduleId: "m8-scheduling",
  title: "Limited Direct Execution",
  order: 0,
  estMinutes: 18,
  objectives: [
    "Explain how the OS runs user code directly yet stays in control",
    "Describe the timer interrupt's role in preemption",
    "Connect mode switches to the scheduler",
  ],
  prereqs: ["m5-processes"],
  tags: ["scheduling", "os"],
  sourceRefs: ["OSTEP scheduling: mechanism"],
  triviaTags: [],
  relatedProblems: [],
});

export default meta;
