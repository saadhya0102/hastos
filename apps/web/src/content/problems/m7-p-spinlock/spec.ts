import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef SPINLOCK_H
#define SPINLOCK_H
#include <stdatomic.h>

typedef struct { atomic_int locked; } spinlock_t;

void spin_init(spinlock_t *s);    /* set to unlocked */
void spin_lock(spinlock_t *s);    /* acquire (busy-wait) */
void spin_unlock(spinlock_t *s);  /* release */

#endif
`;

const STARTER = `#include "spinlock.h"

void spin_init(spinlock_t *s) {
  atomic_store(&s->locked, 0);
}

void spin_lock(spinlock_t *s) {
  /* TODO: busy-wait until you atomically change locked from 0 to 1.
     Hint: int expected = 0; while (!atomic_compare_exchange_weak(&s->locked, &expected, 1)) expected = 0;
     (or use atomic_exchange returning the old value). Use acquire ordering. */
}

void spin_unlock(spinlock_t *s) {
  /* TODO: store 0 with release ordering. */
}
`;

const problem: ProblemDef = defineProblem({
  id: "m7-p-spinlock",
  title: "Spinlock (atomics)",
  difficulty: "medium",
  topicTags: ["concurrency", "atomics", "locks", "c"],
  moduleId: "m7-concurrency",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement spin_init/spin_lock/spin_unlock in spinlock.c (no main).",
  constraints: "Use C11 atomics only (no pthread mutex). Must provide real mutual exclusion.",
  examples: [
    { title: "Exclusion", body: "N threads each increment a shared counter under the lock; the total is exact" },
  ],
  starterFiles: {
    c: [
      { path: "spinlock.h", content: HEADER, editable: false },
      { path: "spinlock.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "concurrency",
  limits: { cpuSec: 6, wallSec: 15, memoryKb: 262144 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["tsan"], seeds: [1] },
  tests: [
    { name: "single", visibility: "sample" },
    { name: "two_threads", visibility: "hidden" },
    { name: "four_threads", visibility: "hidden" },
    { name: "reacquire", visibility: "hidden" },
    { name: "high_contention", visibility: "hidden" },
  ],
  followUps: [
    "Why use acquire on lock and release on unlock?",
    "How would a ticket lock improve fairness, and why add backoff while spinning?",
  ],
  triviaTags: ["mutex-vs-spinlock", "cas"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
