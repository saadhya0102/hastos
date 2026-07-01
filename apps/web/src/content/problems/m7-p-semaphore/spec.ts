import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef CSEM_H
#define CSEM_H
#include <pthread.h>
typedef struct { pthread_mutex_t m; pthread_cond_t c; int count; } csem_t;
void csem_init(csem_t *s, int value);
void csem_wait(csem_t *s);   /* P / down: block while count == 0, then decrement */
void csem_post(csem_t *s);   /* V / up: increment and wake a waiter */
#endif
`;
const STARTER = `#include "csem.h"

void csem_init(csem_t *s, int value) {
  pthread_mutex_init(&s->m, 0); pthread_cond_init(&s->c, 0); s->count = value;
}

void csem_wait(csem_t *s) {
  /* TODO: lock; while count == 0 wait; count--; unlock. */
}
void csem_post(csem_t *s) {
  /* TODO: lock; count++; signal; unlock. */
}
`;
const problem: ProblemDef = defineProblem({
  id: "m7-p-semaphore", title: "Counting Semaphore", difficulty: "medium",
  topicTags: ["concurrency", "condition-variables", "c"], moduleId: "m7-concurrency", interview: true,
  allowedLanguages: ["c"], statementMdx: "./statement.mdx",
  signatureNote: "Implement csem_wait/csem_post in csem.c (init provided).",
  constraints: "Build a counting semaphore from a mutex + condition variable. wait blocks at 0; post wakes a waiter.",
  examples: [{ title: "As a mutex", body: "a semaphore initialized to 1 provides mutual exclusion" }],
  starterFiles: { c: [{ path: "csem.h", content: HEADER, editable: false }, { path: "csem.c", content: STARTER, editable: true }] },
  gradingMode: "concurrency", limits: { cpuSec: 6, wallSec: 15, memoryKb: 262144 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "as_mutex", visibility: "sample" },
    { name: "signal_release", visibility: "hidden" },
    { name: "permits", visibility: "hidden" },
    { name: "high_contention", visibility: "hidden" },
    { name: "post_before_wait", visibility: "hidden" },
  ],
  followUps: ["How do two semaphores (empty/full) plus a mutex implement a bounded buffer?"],
  triviaTags: ["lost-wakeup"], hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});
export default problem;
