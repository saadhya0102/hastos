import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef GCD_H
#define GCD_H

/* Greatest common divisor. gcd(x, 0) = x, gcd(0, 0) = 0. */
unsigned gcd(unsigned a, unsigned b);

#endif
`;

const STARTER = `#include "gcd.h"

unsigned gcd(unsigned a, unsigned b) {
  /* TODO: Euclid's algorithm — repeatedly replace (a, b) with (b, a % b) until b == 0. */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m1-p-gcd",
  title: "Greatest Common Divisor",
  difficulty: "easy",
  topicTags: ["integers", "algorithms"],
  moduleId: "m1-data",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement gcd in gcd.c (no main).",
  constraints: "gcd(x, 0) = x, gcd(0, 0) = 0. Use Euclid's algorithm (no factoring).",
  examples: [
    { title: "Common factor", body: "gcd(12, 8) = 4; gcd(48, 36) = 12" },
    { title: "Coprime / zero", body: "gcd(17, 5) = 1; gcd(0, 5) = 5" },
  ],
  starterFiles: {
    c: [
      { path: "gcd.h", content: HEADER, editable: false },
      { path: "gcd.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "basic", visibility: "sample" },
    { name: "coprime", visibility: "hidden" },
    { name: "a_zero", visibility: "hidden" },
    { name: "b_zero", visibility: "hidden" },
    { name: "multiple", visibility: "hidden" },
    { name: "larger", visibility: "hidden" },
  ],
  followUps: [
    "Why does the Euclidean algorithm terminate, and what is its worst-case input (hint: Fibonacci)?",
    "How would you compute the least common multiple from gcd without overflowing?",
  ],
  triviaTags: [],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
