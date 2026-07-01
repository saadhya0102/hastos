import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef GRAY_H
#define GRAY_H
#include <stdint.h>
/* Convert a binary value to its Gray code (consecutive values differ by one bit). */
uint32_t binary_to_gray(uint32_t x);
#endif
`;
const STARTER = `#include "gray.h"

uint32_t binary_to_gray(uint32_t x) {
  /* TODO: one line -> x XOR (x >> 1). */
  return 0;
}
`;
const problem: ProblemDef = defineProblem({
  id: "m1-p-binary-to-gray",
  title: "Binary to Gray Code",
  difficulty: "easy",
  topicTags: ["bits", "c"],
  moduleId: "m1-data",
  interview: false,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement binary_to_gray in gray.c (no main).",
  constraints: "Gray code = x ^ (x >> 1).",
  examples: [{ title: "Sequence", body: "0,1,2,3 -> 0,1,3,2 (one bit changes each step)" }],
  starterFiles: { c: [{ path: "gray.h", content: HEADER, editable: false }, { path: "gray.c", content: STARTER, editable: true }] },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "two", visibility: "sample" },
    { name: "zero", visibility: "hidden" },
    { name: "one", visibility: "hidden" },
    { name: "three", visibility: "hidden" },
    { name: "four", visibility: "hidden" },
  ],
  followUps: ["How do you convert Gray code back to binary?"],
  triviaTags: [],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});
export default problem;
