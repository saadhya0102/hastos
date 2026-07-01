import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m0-using-hastos",
  moduleId: "m0-orientation",
  title: "Using HastOS: Run, Submit, and SLAVA",
  order: 3,
  estMinutes: 18,
  objectives: [
    "Distinguish Run (experiment) from Submit (graded against hidden tests)",
    "Read the per-test results panel and the output console",
    "Use SLAVA effectively: start with a nudge, escalate only as needed",
  ],
  prereqs: ["m0-toolchain"],
  tags: ["orientation", "ide", "slava"],
  sourceRefs: [],
  triviaTags: ["sanitizers"],
  relatedProblems: ["m0-p-strlen"],
});

export default meta;
