import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef CACHESIM_H
#define CACHESIM_H
/*
 * Simulate a DIRECT-MAPPED cache.
 *  - num_sets:   number of sets (1..4096), a power of two
 *  - block_bytes: bytes per cache line (a power of two)
 *  - addrs[n]:   byte addresses accessed in order
 * Write the hit and miss counts through *hits and *misses.
 */
void cache_sim(int num_sets, int block_bytes, const unsigned long *addrs,
               int n, int *hits, int *misses);
#endif
`;

const STARTER = `#include "cachesim.h"

void cache_sim(int num_sets, int block_bytes, const unsigned long *addrs,
               int n, int *hits, int *misses) {
  /* TODO:
     For each address:
       line = addr / block_bytes
       set  = line % num_sets
       tag  = line / num_sets
     Keep, per set, a valid bit and the stored tag. A matching valid tag is a hit;
     otherwise it's a miss (load the line, replacing whatever was there).
     You may assume num_sets <= 4096 (e.g., a local array indexed by set). */
  *hits = 0;
  *misses = 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m3-p-cache-sim",
  title: "Direct-Mapped Cache Simulator",
  difficulty: "medium",
  topicTags: ["cache", "performance", "c"],
  moduleId: "m3-performance",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement cache_sim in cachesim.c (no main).",
  constraints: "Direct-mapped. num_sets and block_bytes are powers of two; num_sets <= 4096.",
  examples: [
    { title: "Cold", body: "one access to a fresh line is 1 miss, 0 hits" },
    { title: "Reuse", body: "accessing the same line again is a hit" },
  ],
  starterFiles: {
    c: [
      { path: "cachesim.h", content: HEADER, editable: false },
      { path: "cachesim.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "single_miss", visibility: "sample" },
    { name: "repeat_hit", visibility: "hidden" },
    { name: "conflict_evict", visibility: "hidden" },
    { name: "mixed_trace", visibility: "hidden" },
    { name: "empty", visibility: "hidden" },
  ],
  followUps: [
    "How would you extend this to set-associative with LRU replacement?",
    "Which miss category dominates each test (compulsory, capacity, conflict)?",
  ],
  triviaTags: ["cache-line-64"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
