import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef HAMMING_H
#define HAMMING_H
#include <stdint.h>

/* Number of bit positions at which a and b differ. */
int hamming(uint32_t a, uint32_t b);

#endif
`;

const STARTER = `#include "hamming.h"

int hamming(uint32_t a, uint32_t b) {
  /* TODO: return the Hamming distance = number of differing bits.
     Hint: it's the popcount of (a ^ b). */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m1-p-hamming",
  title: "Hamming Distance",
  difficulty: "easy",
  topicTags: ["bit-manipulation", "integers"],
  moduleId: "m1-data",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement hamming in hamming.c (no main).",
  constraints: "Count differing bits over all 32 positions. Equal inputs give 0.",
  examples: [
    { title: "Basic", body: "hamming(0,1)=1; hamming(0xA,0x5)=4" },
    { title: "Edges", body: "hamming(x,x)=0; hamming(0xFFFFFFFF,0)=32" },
  ],
  starterFiles: {
    c: [
      { path: "hamming.h", content: HEADER, editable: false },
      { path: "hamming.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "same", visibility: "sample" },
    { name: "one", visibility: "hidden" },
    { name: "byte", visibility: "hidden" },
    { name: "all", visibility: "hidden" },
    { name: "alt", visibility: "hidden" },
  ],
  followUps: [
    "Why does XOR reduce Hamming distance to a popcount?",
    "How does Kernighan's `x &= x - 1` loop count set bits in O(number of set bits)?",
  ],
  triviaTags: ["bit-tricks"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
