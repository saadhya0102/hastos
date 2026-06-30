import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef RRSCHED_H
#define RRSCHED_H
/* Round-robin simulation. All jobs (indices 0..n-1) are ready at time 0, in index order.
   Each turn a job runs up to 'quantum' time units; if it still has work it goes to the back
   of the ready queue. Fill order_out[] with job indices in the order they COMPLETE. */
void rr_order(const int *burst, int n, int quantum, int *order_out);
#endif
`;

const STARTER = `#include "rrsched.h"

void rr_order(const int *burst, int n, int quantum, int *order_out) {
  /* TODO: simulate a ready queue [0,1,...,n-1] with remaining times = burst[].
     Repeatedly take the front job, run min(remaining, quantum); subtract; if remaining > 0
     push it to the back, else append its index to order_out. */
}
`;

const problem: ProblemDef = defineProblem({
  id: "m8-p-rr-order",
  title: "Round-Robin Completion Order",
  difficulty: "medium",
  topicTags: ["scheduling", "os", "c"],
  moduleId: "m8-scheduling",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement rr_order in rrsched.c (no main).",
  constraints: "All jobs ready at t=0 in index order. Quantum >= 1. Fill order_out with completion order.",
  examples: [{ title: "Mixed", body: "bursts [3,1,2], quantum 1 -> completion order 1,2,0" }],
  starterFiles: {
    c: [
      { path: "rrsched.h", content: HEADER, editable: false },
      { path: "rrsched.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "single_each", visibility: "sample" },
    { name: "q1_mixed", visibility: "hidden" },
    { name: "big_quantum", visibility: "hidden" },
    { name: "q2_two", visibility: "hidden" },
    { name: "four", visibility: "hidden" },
  ],
  followUps: ["How does a large quantum make RR behave like FIFO?"],
  triviaTags: ["rr-quantum"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
