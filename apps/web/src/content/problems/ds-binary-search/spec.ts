import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef LOWERB_H
#define LOWERB_H

/* First index i in the ascending array a[0..n) with a[i] >= key, or n if none. */
int lower_bound(const int *a, int n, int key);

#endif
`;

const STARTER = `#include "lowerb.h"

int lower_bound(const int *a, int n, int key) {
  /* TODO: binary search for the first index whose value is >= key.
     Maintain [lo, hi] and converge; return lo. This is std::lower_bound. */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "ds-binary-search",
  title: "Binary Search (lower_bound)",
  difficulty: "medium",
  topicTags: ["data-structures", "algorithms", "binary-search"],
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement lower_bound in lowerb.c (no main).",
  constraints:
    "Array is sorted ascending. Return the first index with a[i] >= key, or n if all are smaller. O(log n).",
  examples: [
    { title: "Found / between", body: "a=[1,3,5,7]: key 5 -> 2; key 4 -> 2" },
    { title: "Edges", body: "key below all -> 0; key above all -> n; duplicates -> leftmost" },
  ],
  starterFiles: {
    c: [
      { path: "lowerb.h", content: HEADER, editable: false },
      { path: "lowerb.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "found", visibility: "sample" },
    { name: "between", visibility: "hidden" },
    { name: "before", visibility: "hidden" },
    { name: "after", visibility: "hidden" },
    { name: "dups", visibility: "hidden" },
    { name: "empty", visibility: "hidden" },
  ],
  followUps: [
    "Why is `lo + (hi - lo) / 2` preferred over `(lo + hi) / 2` for the midpoint?",
    "How does lower_bound differ from upper_bound, and how do the two give you a count of a key?",
  ],
  triviaTags: ["data-structures"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
