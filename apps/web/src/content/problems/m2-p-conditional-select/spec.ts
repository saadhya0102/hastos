import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef SELECT_H
#define SELECT_H
/* Return a if cond is non-zero, else b. */
int select_int(int cond, int a, int b);
#endif
`;

const STARTER = `#include "select.h"

int select_int(int cond, int a, int b) {
  /* TODO: return a when cond != 0, otherwise b. Try it branchlessly with a mask. */
  return b;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m2-p-conditional-select",
  title: "Branchless Conditional Select",
  difficulty: "easy",
  topicTags: ["x86-64", "bits", "c"],
  moduleId: "m2-machine",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement select_int in select.c (no main).",
  constraints: "Return a if cond is non-zero, else b. Any non-zero cond counts as true.",
  examples: [
    { title: "True", body: "select_int(1, 10, 20) returns 10" },
    { title: "False", body: "select_int(0, 10, 20) returns 20" },
  ],
  starterFiles: {
    c: [
      { path: "select.h", content: HEADER, editable: false },
      { path: "select.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "true_one", visibility: "sample" },
    { name: "false_zero", visibility: "hidden" },
    { name: "truthy_nonone", visibility: "hidden" },
    { name: "negative_cond", visibility: "hidden" },
    { name: "equal_values", visibility: "hidden" },
  ],
  followUps: [
    "How would a compiler implement this with cmov?",
    "Build a branchless version: turn cond into a 0/-1 mask and blend a and b.",
  ],
  triviaTags: ["condition-codes"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
