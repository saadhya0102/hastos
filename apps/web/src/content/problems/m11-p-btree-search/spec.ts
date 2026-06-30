import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef BTREESEARCH_H
#define BTREESEARCH_H
/* B-tree node search: given a node's sorted keys[0..n-1], return the index of the first key
   that is >= target (the child index to descend into). Return n if all keys are < target.
   Must run in O(log n) (binary search). */
int node_lower_bound(const int *keys, int n, int target);
#endif
`;

const STARTER = `#include "btreesearch.h"

int node_lower_bound(const int *keys, int n, int target) {
  /* TODO: binary search for the first index i with keys[i] >= target; return n if none.
     Hint: lo=0, hi=n; while (lo<hi){ mid=lo+(hi-lo)/2; if (keys[mid] < target) lo=mid+1; else hi=mid; } return lo; */
  return n;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m11-p-btree-search",
  title: "B-Tree Node Search (lower bound)",
  difficulty: "medium",
  topicTags: ["storage", "databases", "b-tree", "c"],
  moduleId: "m11-storage",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement node_lower_bound in btreesearch.c (no main).",
  constraints: "keys sorted ascending. Return first index with keys[i] >= target, or n. O(log n).",
  examples: [
    { title: "Between", body: "keys [10,20,30], target 15 -> index 1" },
    { title: "After all", body: "keys [10,20,30], target 40 -> index 3" },
  ],
  starterFiles: {
    c: [
      { path: "btreesearch.h", content: HEADER, editable: false },
      { path: "btreesearch.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "exact", visibility: "sample" },
    { name: "between", visibility: "hidden" },
    { name: "before_all", visibility: "hidden" },
    { name: "after_all", visibility: "hidden" },
    { name: "large", visibility: "hidden" },
  ],
  followUps: ["How does this become the descent step in a full B-tree search?"],
  triviaTags: ["b-tree-fanout"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
