import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef SJF_H
#define SJF_H

/* Sum of turnaround times under Shortest-Job-First (all jobs arrive at t=0). */
long sjf_total_turnaround(const int *burst, int n);

#endif
`;

const STARTER = `#include "sjf.h"

long sjf_total_turnaround(const int *burst, int n) {
  /* TODO: schedule shortest job first (all arrive at t=0).
     1. Copy bursts into a local array (the input is const).
     2. Sort ascending.
     3. Completion time is a running prefix sum; turnaround == completion (arrival 0).
     4. Return the sum of turnaround times.
     Tip: a fixed local array (e.g. int tmp[n];) avoids malloc/leaks. */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m8-p-sjf",
  title: "SJF Turnaround Time",
  difficulty: "medium",
  topicTags: ["scheduling", "os", "algorithms"],
  moduleId: "m8-scheduling",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement sjf_total_turnaround in sjf.c (no main).",
  constraints:
    "All jobs arrive at t=0. Non-preemptive SJF. Return the SUM of turnaround times (an exact integer). n may be 0.",
  examples: [
    { title: "Classic", body: "bursts [100,10,10] -> run 10,10,100 -> 10+20+120 = 150" },
    { title: "Equal", body: "bursts [2,2,2] -> 2+4+6 = 12" },
  ],
  starterFiles: {
    c: [
      { path: "sjf.h", content: HEADER, editable: false },
      { path: "sjf.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "classic", visibility: "sample" },
    { name: "single", visibility: "hidden" },
    { name: "empty", visibility: "hidden" },
    { name: "sorted", visibility: "hidden" },
    { name: "reverse", visibility: "hidden" },
    { name: "equal", visibility: "hidden" },
  ],
  followUps: [
    "Why does SJF minimize average turnaround for jobs that arrive together (the exchange argument)?",
    "How does the answer change if jobs arrive at different times (STCF / preemption)?",
  ],
  triviaTags: ["scheduling"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
