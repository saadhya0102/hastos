import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef ISPOW2_H
#define ISPOW2_H

/* Return 1 if x is a power of two (exactly one bit set), else 0. Zero is not. */
int is_pow2(unsigned long long x);

#endif
`;

const STARTER = `#include "ispow2.h"

int is_pow2(unsigned long long x) {
  /* TODO: return 1 iff exactly one bit is set. Zero must return 0.
     Hint: a power of two has the property that (x & (x - 1)) == 0. */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m1-p-is-pow2",
  title: "Is it a power of two?",
  difficulty: "easy",
  topicTags: ["bit-manipulation", "integers"],
  moduleId: "m1-data",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement is_pow2 in ispow2.c (no main).",
  constraints: "Return 1 or 0. Zero is not a power of two. Aim for O(1) with no loop.",
  examples: [
    { title: "Powers", body: "is_pow2(1)=1, is_pow2(2)=1, is_pow2(1<<40)=1" },
    { title: "Non-powers", body: "is_pow2(0)=0, is_pow2(3)=0, is_pow2((1<<40)+1)=0" },
  ],
  starterFiles: {
    c: [
      { path: "ispow2.h", content: HEADER, editable: false },
      { path: "ispow2.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "one", visibility: "sample" },
    { name: "two", visibility: "hidden" },
    { name: "three", visibility: "hidden" },
    { name: "zero", visibility: "hidden" },
    { name: "big", visibility: "hidden" },
    { name: "big_plus", visibility: "hidden" },
    { name: "high_bit", visibility: "hidden" },
  ],
  followUps: [
    "Why does (x & (x - 1)) clear the lowest set bit, and why does that detect powers of two?",
    "How would you round x up to the next power of two?",
  ],
  triviaTags: ["bit-tricks"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
