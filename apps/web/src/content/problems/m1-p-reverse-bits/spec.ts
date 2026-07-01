import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef REVBITS_H
#define REVBITS_H
#include <stdint.h>
/* Reverse the 32 bits of x (bit i maps to bit 31 - i). */
uint32_t reverse_bits(uint32_t x);
#endif
`;
const STARTER = `#include "revbits.h"

uint32_t reverse_bits(uint32_t x) {
  /* TODO: build the result by shifting r left and pulling bits off the bottom of x (32 times). */
  return 0;
}
`;
const problem: ProblemDef = defineProblem({
  id: "m1-p-reverse-bits",
  title: "Reverse Bits",
  difficulty: "easy",
  topicTags: ["bits", "c"],
  moduleId: "m1-data",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement reverse_bits in revbits.c (no main).",
  constraints: "32-bit reversal; bit i -> bit 31-i.",
  examples: [{ title: "LSB to MSB", body: "reverse_bits(1) == 0x80000000" }],
  starterFiles: { c: [{ path: "revbits.h", content: HEADER, editable: false }, { path: "revbits.c", content: STARTER, editable: true }] },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "zero", visibility: "sample" },
    { name: "one", visibility: "hidden" },
    { name: "top_bit", visibility: "hidden" },
    { name: "all_ones", visibility: "hidden" },
    { name: "two", visibility: "hidden" },
  ],
  followUps: ["How would a divide-and-conquer (swap nibbles/bytes/halves) version work in log steps?"],
  triviaTags: ["endianness"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});
export default problem;
