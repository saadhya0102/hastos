import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef ALIGNUP_H
#define ALIGNUP_H
#include <stddef.h>

/* Round n up to the nearest multiple of align (a power of two). */
size_t align_up(size_t n, size_t align);

#endif
`;

const STARTER = `#include "alignup.h"

size_t align_up(size_t n, size_t align) {
  /* TODO: round n up to a multiple of align (a power of two), with no branch.
     Hint: (n + align - 1) & ~(align - 1). */
  return n;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m6-p-align-up",
  title: "Align Up to a Power of Two",
  difficulty: "easy",
  topicTags: ["memory", "bit-manipulation", "allocators"],
  moduleId: "m6-virtual-memory",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement align_up in alignup.c (no main).",
  constraints: "align is a power of two (>= 1). Already-aligned values are unchanged. Aim for O(1), no loop.",
  examples: [
    { title: "Round up", body: "align_up(9, 8) = 16; align_up(1000, 4096) = 4096" },
    { title: "Exact / one", body: "align_up(8, 8) = 8; align_up(100, 1) = 100" },
  ],
  starterFiles: {
    c: [
      { path: "alignup.h", content: HEADER, editable: false },
      { path: "alignup.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "round_up", visibility: "sample" },
    { name: "zero", visibility: "hidden" },
    { name: "exact", visibility: "hidden" },
    { name: "one", visibility: "hidden" },
    { name: "page", visibility: "hidden" },
    { name: "align_one", visibility: "hidden" },
  ],
  followUps: [
    "Why does the mask ~(align - 1) work only when align is a power of two?",
    "How would you align a pointer, and what does alignof / _Alignas give you here?",
  ],
  triviaTags: ["malloc-alignment", "bit-tricks"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
