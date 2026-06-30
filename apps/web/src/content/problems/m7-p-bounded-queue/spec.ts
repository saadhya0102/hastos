import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef BQUEUE_H
#define BQUEUE_H
#include <pthread.h>

typedef struct {
  int *buf;
  int cap, head, tail, count;
  pthread_mutex_t m;
  pthread_cond_t not_full;
  pthread_cond_t not_empty;
} bqueue_t;

/* Initialize over a caller-provided storage array of \`cap\` ints. */
void bq_init(bqueue_t *q, int *storage, int cap);
/* Block while full, then enqueue value (FIFO). */
void bq_push(bqueue_t *q, int value);
/* Block while empty, then dequeue and return the oldest value. */
int bq_pop(bqueue_t *q);

#endif
`;

const STARTER = `#include "bqueue.h"

void bq_init(bqueue_t *q, int *storage, int cap) {
  q->buf = storage; q->cap = cap; q->head = q->tail = q->count = 0;
  pthread_mutex_init(&q->m, NULL);
  pthread_cond_init(&q->not_full, NULL);
  pthread_cond_init(&q->not_empty, NULL);
}

void bq_push(bqueue_t *q, int value) {
  /* TODO: lock; while full wait on not_full; store value, advance tail, count++;
     signal not_empty; unlock. */
}

int bq_pop(bqueue_t *q) {
  /* TODO: lock; while empty wait on not_empty; read value, advance head, count--;
     signal not_full; unlock; return value. */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m7-p-bounded-queue",
  title: "Blocking Bounded Queue",
  difficulty: "medium",
  topicTags: ["concurrency", "condition-variables", "c"],
  moduleId: "m7-concurrency",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement bq_push/bq_pop in bqueue.c (bq_init is provided).",
  constraints: "Mutex + condition variables. push blocks when full; pop blocks when empty; FIFO; no lost/duplicated items.",
  examples: [
    { title: "FIFO", body: "push 1,2,3 then pop -> 1,2,3" },
    { title: "Blocking", body: "with a small capacity, producers block until consumers make room" },
  ],
  starterFiles: {
    c: [
      { path: "bqueue.h", content: HEADER, editable: false },
      { path: "bqueue.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "concurrency",
  limits: { cpuSec: 6, wallSec: 15, memoryKb: 262144 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "single_thread_fifo", visibility: "sample" },
    { name: "spsc", visibility: "hidden" },
    { name: "mpsc", visibility: "hidden" },
    { name: "small_capacity", visibility: "hidden" },
    { name: "mpmc", visibility: "hidden" },
  ],
  followUps: [
    "Why must you wait in a while loop, not an if?",
    "Why change state and signal while holding the mutex (lost wakeups)?",
  ],
  triviaTags: ["lost-wakeup"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
