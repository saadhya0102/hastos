import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef DINING_H
#define DINING_H
#include <pthread.h>
/* Philosopher id (0..n-1) needs fork[id] and fork[(id+1)%n]. Eat eat_count times without
   deadlocking, incrementing ate[id] once per meal. Acquire the two forks in a consistent global
   order (e.g., lower index first) to avoid the circular-wait deadlock. */
void dine(int id, int n, pthread_mutex_t *forks, int eat_count, int *ate);
#endif
`;
const STARTER = `#include "dining.h"

void dine(int id, int n, pthread_mutex_t *forks, int eat_count, int *ate) {
  /* TODO: let a = min(id, (id+1)%n), b = max(id, (id+1)%n).
     Repeat eat_count times: lock forks[a], lock forks[b], ate[id]++, unlock both.
     Locking the lower-index fork first for everyone breaks the circular wait. */
}
`;
const problem: ProblemDef = defineProblem({
  id: "m7-p-dining", title: "Dining Philosophers (deadlock-free)", difficulty: "hard",
  topicTags: ["concurrency", "deadlock", "locks", "c"], moduleId: "m7-concurrency", interview: true,
  allowedLanguages: ["c"], statementMdx: "./statement.mdx",
  signatureNote: "Implement dine in dining.c (no main).",
  constraints: "Each philosopher eats eat_count times without deadlock. Use a global fork-acquisition order.",
  examples: [{ title: "No deadlock", body: "all philosophers eat their full count and the program terminates" }],
  starterFiles: { c: [{ path: "dining.h", content: HEADER, editable: false }, { path: "dining.c", content: STARTER, editable: true }] },
  gradingMode: "concurrency", limits: { cpuSec: 6, wallSec: 15, memoryKb: 262144 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "two", visibility: "sample" },
    { name: "three", visibility: "hidden" },
    { name: "five", visibility: "hidden" },
    { name: "many_meals", visibility: "hidden" },
    { name: "large_table", visibility: "hidden" },
  ],
  followUps: ["Why does 'lock lower index first' break the deadlock? Which Coffman condition does it eliminate?"],
  triviaTags: ["deadlock-conditions"], hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});
export default problem;
