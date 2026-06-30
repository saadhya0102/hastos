import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef LSMMERGE_H
#define LSMMERGE_H
/*
 * Merge two sorted runs (compaction). Each run has ascending, unique keys.
 * run 2 is NEWER: when a key appears in both, the value from run 2 wins.
 * Write merged (sorted, unique) keys/values to ko[]/vo[] and return the merged length.
 */
int lsm_merge(const int *k1, const int *v1, int n1,
              const int *k2, const int *v2, int n2,
              int *ko, int *vo);
#endif
`;

const STARTER = `#include "lsmmerge.h"

int lsm_merge(const int *k1, const int *v1, int n1,
              const int *k2, const int *v2, int n2,
              int *ko, int *vo) {
  /* TODO: two-pointer merge. When k1[i] == k2[j], emit the NEWER value v2[j] and advance both.
     Otherwise emit the smaller key. Return the number of merged entries. */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m11-p-lsm-merge",
  title: "LSM Compaction Merge",
  difficulty: "medium",
  topicTags: ["storage", "databases", "lsm", "c"],
  moduleId: "m11-storage",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement lsm_merge in lsmmerge.c (no main).",
  constraints: "Both runs sorted ascending with unique keys. On duplicate key, run 2 (newer) wins. Output sorted unique.",
  examples: [
    { title: "Newer wins", body: "A {1:10,2:20,3:30}, B {2:99} -> {1:10,2:99,3:30}" },
  ],
  starterFiles: {
    c: [
      { path: "lsmmerge.h", content: HEADER, editable: false },
      { path: "lsmmerge.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "disjoint", visibility: "sample" },
    { name: "overlap_newer_wins", visibility: "hidden" },
    { name: "empty_a", visibility: "hidden" },
    { name: "empty_b", visibility: "hidden" },
    { name: "all_overlap", visibility: "hidden" },
  ],
  followUps: ["How would you extend this to a k-way merge across many SSTables, and handle tombstones?"],
  triviaTags: ["lsm-compaction"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
