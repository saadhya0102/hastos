import { LessonMetaSchema, type LessonMeta } from "@hasystor/content-schema";

const meta: LessonMeta = LessonMetaSchema.parse({
  id: "m4-relocation-loading",
  moduleId: "m4-linking",
  title: "Relocation, PIC/PIE, and the Loader",
  order: 3,
  estMinutes: 32,
  objectives: [
    "Explain relocation: fixing up addresses when sections are placed",
    "Describe position-independent code (PIC) and the GOT/PLT",
    "Trace what the loader does to start a program",
    "Connect PIE to ASLR and security",
  ],
  prereqs: ["m4-static-dynamic"],
  tags: ["linking", "loading", "security"],
  sourceRefs: ["CS:APP §7.7-7.12"],
  triviaTags: ["got-plt"],
  relatedProblems: [],
});

export default meta;
