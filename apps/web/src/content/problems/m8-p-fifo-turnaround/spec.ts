import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef FIFOSCHED_H
#define FIFOSCHED_H
/* All jobs arrive at time 0 and run to completion in array order (FIFO).
   Return the sum of turnaround times (turnaround = completion time, since arrival is 0). */
long total_turnaround_fifo(const int *burst, int n);
#endif
`;

const STARTER = `#include "fifosched.h"

long total_turnaround_fifo(const int *burst, int n) {
  /* TODO: completion[i] = sum of burst[0..i]; turnaround[i] = completion[i];
     return the sum of all turnaround times. */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m8-p-fifo-turnaround",
  title: "FIFO Turnaround Time",
  difficulty: "easy",
  topicTags: ["scheduling", "os", "c"],
  moduleId: "m8-scheduling",
  interview: false,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement total_turnaround_fifo in fifosched.c (no main).",
  constraints: "Jobs arrive at 0, run in order. Return sum of completion times.",
  examples: [{ title: "Convoy", body: "bursts [100,10,10] -> completions 100,110,120 -> sum 330" }],
  starterFiles: {
    c: [
      { path: "fifosched.h", content: HEADER, editable: false },
      { path: "fifosched.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "convoy", visibility: "sample" },
    { name: "single", visibility: "hidden" },
    { name: "two", visibility: "hidden" },
    { name: "increasing", visibility: "hidden" },
    { name: "five", visibility: "hidden" },
  ],
  followUps: ["How would SJF change the total turnaround for [100,10,10]?"],
  triviaTags: ["convoy-effect"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
