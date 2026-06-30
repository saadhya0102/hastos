import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef BSWAP32_H
#define BSWAP32_H
#include <stdint.h>
/* Reverse the byte order of a 32-bit value. */
uint32_t bswap32(uint32_t x);
#endif
`;

const STARTER = `#include "bswap32.h"

uint32_t bswap32(uint32_t x) {
  /* TODO: move byte 0 to byte 3, byte 1 to byte 2, etc., using masks and shifts. */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m1-p-bswap32",
  title: "Byte Swap (endianness)",
  difficulty: "easy",
  topicTags: ["bits", "endianness", "c"],
  moduleId: "m1-data",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement bswap32 in bswap32.c (no main).",
  constraints: "x is a 32-bit unsigned value. Do not use __builtin_bswap32.",
  examples: [
    { title: "Reverse", body: "bswap32(0x12345678) returns 0x78563412" },
    { title: "Involution", body: "bswap32(bswap32(x)) == x" },
  ],
  starterFiles: {
    c: [
      { path: "bswap32.h", content: HEADER, editable: false },
      { path: "bswap32.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "example", visibility: "sample" },
    { name: "zero", visibility: "hidden" },
    { name: "all_ones", visibility: "hidden" },
    { name: "low_byte_only", visibility: "hidden" },
    { name: "involution", visibility: "hidden" },
  ],
  followUps: [
    "How does this relate to htonl/ntohl and network byte order?",
    "Could you swap a 64-bit value the same way? What changes?",
  ],
  triviaTags: ["endianness"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
