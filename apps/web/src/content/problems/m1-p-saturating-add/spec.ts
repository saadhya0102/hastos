import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef SATADD_H
#define SATADD_H
#include <stdint.h>
/* Add a and b, clamping (saturating) at 255 instead of wrapping. */
uint8_t sat_add_u8(uint8_t a, uint8_t b);
#endif
`;

const STARTER = `#include "satadd.h"

uint8_t sat_add_u8(uint8_t a, uint8_t b) {
  /* TODO: compute a + b in a wider type, then clamp to 255 if it exceeds it. */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m1-p-saturating-add",
  title: "Saturating Add (uint8)",
  difficulty: "easy",
  topicTags: ["overflow", "representation", "c"],
  moduleId: "m1-data",
  interview: false,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement sat_add_u8 in satadd.c (no main).",
  constraints: "Inputs and output are uint8_t (0..255). On overflow, clamp to 255 (do not wrap).",
  examples: [
    { title: "Normal", body: "sat_add_u8(100, 50) returns 150" },
    { title: "Clamp", body: "sat_add_u8(200, 100) returns 255 (not 44)" },
  ],
  starterFiles: {
    c: [
      { path: "satadd.h", content: HEADER, editable: false },
      { path: "satadd.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "no_overflow", visibility: "sample" },
    { name: "both_zero", visibility: "hidden" },
    { name: "exact_max", visibility: "hidden" },
    { name: "overflow_clamps", visibility: "hidden" },
    { name: "max_plus_max", visibility: "hidden" },
  ],
  followUps: [
    "Why compute the sum in a wider type before clamping?",
    "How would you generalize saturation to signed values (clamping at both ends)?",
  ],
  triviaTags: ["signed-overflow-ub"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
