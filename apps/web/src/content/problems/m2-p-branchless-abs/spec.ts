import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef BRANCHLESS_ABS_H
#define BRANCHLESS_ABS_H
/* Return the absolute value of x WITHOUT using branches (no if, ?:, loops). */
int my_abs(int x);
#endif
`;

const STARTER = `#include "babs.h"

int my_abs(int x) {
  /* TODO (no branches): hint -> int mask = x >> 31; then combine with XOR and subtraction. */
  return x;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m2-p-branchless-abs",
  title: "Branchless Absolute Value",
  difficulty: "medium",
  topicTags: ["x86-64", "bits", "c"],
  moduleId: "m2-machine",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement my_abs in babs.c (no main).",
  constraints: "No branches (if/?:/loops). Assume x != INT_MIN. Uses arithmetic shift + XOR.",
  examples: [
    { title: "Positive", body: "my_abs(5) returns 5" },
    { title: "Negative", body: "my_abs(-5) returns 5" },
  ],
  starterFiles: {
    c: [
      { path: "babs.h", content: HEADER, editable: false },
      { path: "babs.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "positive", visibility: "sample" },
    { name: "negative", visibility: "hidden" },
    { name: "zero", visibility: "hidden" },
    { name: "large_positive", visibility: "hidden" },
    { name: "large_negative", visibility: "hidden" },
  ],
  followUps: [
    "How does `x >> 31` produce a mask of all-ones or all-zeros?",
    "Why does this map nicely to a conditional move (cmov) at the machine level?",
    "Why is INT_MIN excluded (what would abs(INT_MIN) do)?",
  ],
  triviaTags: ["twos-complement", "condition-codes"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
