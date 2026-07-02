import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef CTZ_H
#define CTZ_H
#include <stdint.h>

/* Count trailing zero bits. Define ctz32(0) == 32. */
int ctz32(uint32_t x);

#endif
`;

const STARTER = `#include "ctz.h"

int ctz32(uint32_t x) {
  /* TODO: return the number of trailing zero bits (from the least-significant end).
     ctz32(0) must return 32.
     Hint: __builtin_ctz is UB on 0, so special-case 0 yourself. */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m1-p-ctz",
  title: "Count Trailing Zeros",
  difficulty: "easy",
  topicTags: ["bit-manipulation", "integers"],
  moduleId: "m1-data",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement ctz32 in ctz.c (no main).",
  constraints: "ctz32(0) == 32. Aim for O(1) or a small loop over 32 bits.",
  examples: [
    { title: "Powers of two", body: "ctz32(1)=0, ctz32(2)=1, ctz32(8)=3" },
    { title: "Edge", body: "ctz32(0)=32; ctz32(0x80000000)=31" },
  ],
  starterFiles: {
    c: [
      { path: "ctz.h", content: HEADER, editable: false },
      { path: "ctz.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "one", visibility: "sample" },
    { name: "two", visibility: "hidden" },
    { name: "eight", visibility: "hidden" },
    { name: "zero", visibility: "hidden" },
    { name: "high", visibility: "hidden" },
    { name: "mixed", visibility: "hidden" },
  ],
  followUps: [
    "How does x & (-x) isolate the lowest set bit, and how could you use it here?",
    "Why is __builtin_ctz(0) undefined, and how do CPUs expose a safe TZCNT?",
  ],
  triviaTags: ["bit-tricks"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
