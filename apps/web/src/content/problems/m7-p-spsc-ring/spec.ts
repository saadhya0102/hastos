import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef SPSC_H
#define SPSC_H
#include <stdatomic.h>
/* Lock-free single-producer / single-consumer ring buffer. cap is a power of two. */
typedef struct { int *buf; unsigned cap; _Atomic unsigned head; _Atomic unsigned tail; } spsc_t;
void spsc_init(spsc_t *q, int *storage, unsigned cap);
int spsc_push(spsc_t *q, int v);    /* 1 if pushed, 0 if full (producer only) */
int spsc_pop(spsc_t *q, int *out);  /* 1 if popped, 0 if empty (consumer only) */
#endif
`;
const STARTER = `#include "spsc.h"

void spsc_init(spsc_t *q, int *storage, unsigned cap) {
  q->buf = storage; q->cap = cap;
  atomic_store(&q->head, 0u); atomic_store(&q->tail, 0u);
}

int spsc_push(spsc_t *q, int v) {
  /* TODO (producer owns tail): load tail (relaxed) and head (acquire).
     If tail - head == cap, it's full -> return 0. Else store v at buf[tail & (cap-1)],
     then publish tail+1 with release. Return 1. */
  return 0;
}
int spsc_pop(spsc_t *q, int *out) {
  /* TODO (consumer owns head): load head (relaxed) and tail (acquire).
     If head == tail, empty -> return 0. Else *out = buf[head & (cap-1)],
     then publish head+1 with release. Return 1. */
  return 0;
}
`;
const problem: ProblemDef = defineProblem({
  id: "m7-p-spsc-ring", title: "Lock-Free SPSC Ring Buffer", difficulty: "hard",
  topicTags: ["concurrency", "lock-free", "atomics", "c"], moduleId: "m7-concurrency", interview: true,
  allowedLanguages: ["c"], statementMdx: "./statement.mdx",
  signatureNote: "Implement spsc_push/spsc_pop in spsc.c (init provided).",
  constraints: "One producer, one consumer, no locks. cap is a power of two. Preserve FIFO order.",
  examples: [{ title: "Stream", body: "producer pushes 0..N-1; consumer pops them in order" }],
  starterFiles: { c: [{ path: "spsc.h", content: HEADER, editable: false }, { path: "spsc.c", content: STARTER, editable: true }] },
  gradingMode: "concurrency", limits: { cpuSec: 8, wallSec: 18, memoryKb: 262144 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["tsan"], seeds: [1, 7] },
  tests: [
    { name: "single_thread", visibility: "sample" },
    { name: "small_cap", visibility: "hidden" },
    { name: "stream_order", visibility: "hidden" },
    { name: "full_empty", visibility: "hidden" },
    { name: "stress", visibility: "hidden" },
  ],
  followUps: ["Why only relaxed for the index you own but acquire for the other's index?", "Where would false sharing of head/tail hurt, and how do you fix it?"],
  triviaTags: ["memory-ordering", "false-sharing"], hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});
export default problem;
