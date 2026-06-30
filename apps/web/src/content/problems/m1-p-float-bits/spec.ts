import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef FLOATBITS_H
#define FLOATBITS_H
#include <stdint.h>
/* Return the raw IEEE-754 bit pattern of f as a 32-bit unsigned integer. */
uint32_t float_bits(float f);
#endif
`;

const STARTER = `#include "floatbits.h"
#include <string.h>

uint32_t float_bits(float f) {
  /* TODO: reinterpret the bytes of f as a uint32_t.
     Use memcpy to avoid undefined behavior from a pointer-cast alias. */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m1-p-float-bits",
  title: "Float Bit Pattern",
  difficulty: "medium",
  topicTags: ["ieee754", "representation", "c"],
  moduleId: "m1-data",
  interview: false,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement float_bits in floatbits.c (no main).",
  constraints: "Return the exact IEEE-754 single-precision bit pattern. Use memcpy (not an aliasing pointer cast).",
  examples: [
    { title: "One", body: "float_bits(1.0f) returns 0x3F800000" },
    { title: "Zero", body: "float_bits(0.0f) returns 0x00000000" },
  ],
  starterFiles: {
    c: [
      { path: "floatbits.h", content: HEADER, editable: false },
      { path: "floatbits.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "one", visibility: "sample" },
    { name: "zero", visibility: "hidden" },
    { name: "two", visibility: "hidden" },
    { name: "negative_one", visibility: "hidden" },
    { name: "one_half", visibility: "hidden" },
  ],
  followUps: [
    "Why is memcpy preferred over *(uint32_t*)&f for this reinterpretation?",
    "Decode 0x3F800000 by hand: what sign, exponent, and mantissa give 1.0?",
  ],
  triviaTags: ["ieee754-nan"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
