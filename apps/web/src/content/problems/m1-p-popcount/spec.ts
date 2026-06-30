import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef POPCOUNT_H
#define POPCOUNT_H
/* Return the number of set (1) bits in x. */
int popcount(unsigned x);
#endif
`;

const STARTER = `#include "popcount.h"

int popcount(unsigned x) {
  /* TODO: count the set bits. Tip: x &= (x - 1) clears the lowest set bit. */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m1-p-popcount",
  title: "Count Set Bits (popcount)",
  difficulty: "easy",
  topicTags: ["bits", "masks", "c"],
  moduleId: "m1-data",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement popcount in popcount.c (no main).",
  constraints: "x is a 32-bit unsigned int. Do not use __builtin_popcount.",
  examples: [
    { title: "Zero", body: "popcount(0) returns 0" },
    { title: "Byte", body: "popcount(0xFF) returns 8" },
  ],
  starterFiles: {
    c: [
      { path: "popcount.h", content: HEADER, editable: false },
      { path: "popcount.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "zero", visibility: "sample" },
    { name: "one_bit", visibility: "hidden" },
    { name: "byte_all_ones", visibility: "hidden" },
    { name: "mixed", visibility: "hidden" },
    { name: "all_32_bits", visibility: "hidden" },
  ],
  followUps: [
    "How does Brian Kernighan's method (x &= x - 1) compare to checking each bit?",
    "How would a lookup table or SWAR approach speed this up?",
  ],
  triviaTags: ["twos-complement"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
