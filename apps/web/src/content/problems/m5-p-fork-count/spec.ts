import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef FORKCOUNT_H
#define FORKCOUNT_H
/* Total number of processes that exist after the original process executes
   n consecutive fork() calls. (0 <= n <= 31) */
long processes_after_forks(int n);
#endif
`;

const STARTER = `#include "forkcount.h"

long processes_after_forks(int n) {
  /* TODO: each fork doubles the number of processes. With n forks: 2^n total. */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m5-p-fork-count",
  title: "Fork Process Counter",
  difficulty: "easy",
  topicTags: ["processes", "fork", "c"],
  moduleId: "m5-processes",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement processes_after_forks in forkcount.c (no main).",
  constraints: "0 <= n <= 31. Return 2^n as a long. Do not actually call fork().",
  examples: [
    { title: "None", body: "processes_after_forks(0) returns 1 (just the original)" },
    { title: "Three", body: "processes_after_forks(3) returns 8" },
  ],
  starterFiles: {
    c: [
      { path: "forkcount.h", content: HEADER, editable: false },
      { path: "forkcount.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "zero", visibility: "sample" },
    { name: "one", visibility: "hidden" },
    { name: "three", visibility: "hidden" },
    { name: "ten", visibility: "hidden" },
    { name: "thirtyone", visibility: "hidden" },
  ],
  followUps: [
    "Why does each fork double the process count?",
    "If a printf came after the n forks, how many lines would print?",
  ],
  triviaTags: ["zombie-process"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
