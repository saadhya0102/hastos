import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef TRANSPOSE_H
#define TRANSPOSE_H
/* Transpose an n x n row-major int matrix: dst[j*n + i] = src[i*n + j]. */
void transpose(int n, const int *src, int *dst);
#endif
`;

const STARTER = `#include "transpose.h"

void transpose(int n, const int *src, int *dst) {
  /* TODO: for every i, j set dst[j*n + i] = src[i*n + j]. */
}
`;

const problem: ProblemDef = defineProblem({
  id: "m3-p-transpose",
  title: "Matrix Transpose",
  difficulty: "easy",
  topicTags: ["cache", "performance", "c"],
  moduleId: "m3-performance",
  interview: false,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement transpose in transpose.c (no main).",
  constraints: "Square n x n, row-major. dst is distinct from src (no aliasing).",
  examples: [
    { title: "2x2", body: "[[1,2],[3,4]] transposes to [[1,3],[2,4]]" },
  ],
  starterFiles: {
    c: [
      { path: "transpose.h", content: HEADER, editable: false },
      { path: "transpose.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 131072 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "one_by_one", visibility: "sample" },
    { name: "two_by_two", visibility: "hidden" },
    { name: "three_by_three", visibility: "hidden" },
    { name: "four_by_four", visibility: "hidden" },
    { name: "large_64", visibility: "hidden" },
  ],
  followUps: [
    "Which loop order reads src vs writes dst with bad stride, and why can't both be contiguous?",
    "How would blocking/tiling improve a large transpose's cache behavior?",
  ],
  triviaTags: ["cache-line-64"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
