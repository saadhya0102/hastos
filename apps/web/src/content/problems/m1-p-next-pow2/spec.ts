import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef NEXTPOW2_H
#define NEXTPOW2_H
#include <stdint.h>
/* Smallest power of two >= x. next_pow2(0) == 1; exact powers of two return themselves.
   Assume x <= 0x80000000. */
uint32_t next_pow2(uint32_t x);
#endif
`;
const STARTER = `#include "nextpow2.h"

uint32_t next_pow2(uint32_t x) {
  /* TODO: if x <= 1 return 1; else x--, smear bits down (x |= x>>1; x|=x>>2; ... x|=x>>16), return x+1. */
  return 1;
}
`;
const problem: ProblemDef = defineProblem({
  id: "m1-p-next-pow2",
  title: "Round Up to Power of Two",
  difficulty: "easy",
  topicTags: ["bits", "c"],
  moduleId: "m1-data",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement next_pow2 in nextpow2.c (no main).",
  constraints: "Smallest power of two >= x. 0 -> 1. Powers stay. x <= 0x80000000.",
  examples: [{ title: "Round up", body: "next_pow2(5) == 8; next_pow2(8) == 8" }],
  starterFiles: { c: [{ path: "nextpow2.h", content: HEADER, editable: false }, { path: "nextpow2.c", content: STARTER, editable: true }] },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "five", visibility: "sample" },
    { name: "zero", visibility: "hidden" },
    { name: "exact", visibility: "hidden" },
    { name: "seventeen", visibility: "hidden" },
    { name: "large", visibility: "hidden" },
  ],
  followUps: ["Why do hash tables and allocators prefer power-of-two sizes (masking vs modulo)?"],
  triviaTags: [],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});
export default problem;
