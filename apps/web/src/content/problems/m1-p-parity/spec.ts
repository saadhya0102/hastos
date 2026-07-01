import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef PARITY_H
#define PARITY_H
#include <stdint.h>
/* Return 1 if x has an odd number of set bits, else 0. */
int parity(uint32_t x);
#endif
`;
const STARTER = `#include "parity.h"

int parity(uint32_t x) {
  /* TODO: XOR-fold all bits, or clear the lowest set bit repeatedly toggling a flag. */
  return 0;
}
`;
const problem: ProblemDef = defineProblem({
  id: "m1-p-parity",
  title: "Bit Parity",
  difficulty: "easy",
  topicTags: ["bits", "c"],
  moduleId: "m1-data",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement parity in parity.c (no main).",
  constraints: "Return 1 for odd popcount, 0 for even.",
  examples: [{ title: "Odd", body: "parity(0b1011) == 1 (three set bits)" }],
  starterFiles: { c: [{ path: "parity.h", content: HEADER, editable: false }, { path: "parity.c", content: STARTER, editable: true }] },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "zero", visibility: "sample" },
    { name: "one", visibility: "hidden" },
    { name: "three_bits", visibility: "hidden" },
    { name: "seven", visibility: "hidden" },
    { name: "all_ones", visibility: "hidden" },
  ],
  followUps: ["How does a log-step XOR fold (x ^= x>>16; ...) compute parity branch-free?"],
  triviaTags: [],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});
export default problem;
