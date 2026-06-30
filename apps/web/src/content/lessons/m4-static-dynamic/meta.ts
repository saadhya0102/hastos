import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m4-static-dynamic",
  moduleId: "m4-linking",
  title: "Static vs. Dynamic Libraries",
  order: 2,
  estMinutes: 22,
  objectives: [
    "Contrast static archives (.a) with shared libraries (.so)",
    "Explain why linker command-line order matters for static libraries",
    "Describe load-time vs run-time dynamic linking",
    "Weigh the trade-offs: size, updates, performance, deployment",
  ],
  prereqs: ["m4-symbols"],
  tags: ["linking", "libraries"],
  sourceRefs: ["CS:APP §7.6-7.10"],
  triviaTags: ["static-vs-dynamic-link"],
  relatedProblems: [],
});

export default meta;
