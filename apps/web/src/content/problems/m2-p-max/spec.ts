import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef IMAX_H
#define IMAX_H

/* Return the larger of two ints. */
int imax(int a, int b);

#endif
`;

const STARTER = `#include "imax.h"

int imax(int a, int b) {
  /* TODO: return the larger of a and b. Try to do it branchlessly.
     Hint: a ^ ((a ^ b) & -(a < b))  selects a or b without a jump. */
  return a;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m2-p-max",
  title: "Branchless Max",
  difficulty: "easy",
  topicTags: ["machine", "bit-manipulation", "branchless"],
  moduleId: "m2-machine",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement imax in imax.c (no main).",
  constraints: "Return the larger value. Correct for negatives and the int extremes.",
  examples: [
    { title: "Basic", body: "imax(3,5)=5; imax(5,3)=5" },
    { title: "Edges", body: "imax(-1,-2)=-1; imax(INT_MIN,INT_MAX)=INT_MAX" },
  ],
  starterFiles: {
    c: [
      { path: "imax.h", content: HEADER, editable: false },
      { path: "imax.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "basic", visibility: "sample" },
    { name: "swapped", visibility: "hidden" },
    { name: "negatives", visibility: "hidden" },
    { name: "equal", visibility: "hidden" },
    { name: "extremes", visibility: "hidden" },
  ],
  followUps: [
    "Why can a branchless max using (a - b) overflow, and how does the bit-select form avoid it?",
    "When is a plain `a > b ? a : b` actually faster than a branchless trick (hint: cmov, predictability)?",
  ],
  triviaTags: ["bit-tricks"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
