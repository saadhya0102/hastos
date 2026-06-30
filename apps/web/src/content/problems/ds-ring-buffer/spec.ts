import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const RB_HEADER = `#ifndef RINGBUF_H
#define RINGBUF_H
#include <stddef.h>

typedef struct {
  int *buf;
  size_t cap;     /* power of two */
  size_t head;    /* index of next pop */
  size_t tail;    /* index of next push */
  size_t count;
} ringbuf_t;

/* Initialize over a caller-provided array of \`cap\` ints (cap is a power of two). */
void rb_init(ringbuf_t *rb, int *storage, size_t cap);
/* Push value; return 1 on success, 0 if full (must not overwrite). */
int rb_push(ringbuf_t *rb, int value);
/* Pop oldest into *out; return 1 on success, 0 if empty. */
int rb_pop(ringbuf_t *rb, int *out);
/* Current number of elements. */
size_t rb_count(const ringbuf_t *rb);

#endif
`;

const RB_STARTER = `#include "ringbuf.h"

void rb_init(ringbuf_t *rb, int *storage, size_t cap) {
  /* TODO: initialize the fields. cap is guaranteed to be a power of two. */
}

int rb_push(ringbuf_t *rb, int value) {
  /* TODO: reject if full; otherwise store, advance tail, update count. */
  return 0;
}

int rb_pop(ringbuf_t *rb, int *out) {
  /* TODO: reject if empty; otherwise read, advance head, update count. */
  return 0;
}

size_t rb_count(const ringbuf_t *rb) {
  /* TODO */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "ds-ring-buffer",
  title: "Fixed-Capacity Ring Buffer",
  difficulty: "easy",
  topicTags: ["data-structures", "ring-buffer", "memory"],
  moduleId: "m1-data",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement rb_init, rb_push, rb_pop, rb_count in ringbuf.c (no main).",
  constraints: "Capacity is a power of two up to 1024; values are int; FIFO order; pushing when full returns 0.",
  examples: [
    { title: "FIFO", body: "push 1, 2, 3 then pop -> 1, 2, 3" },
    { title: "Full", body: "capacity 2: push 10, 20 succeed; push 30 returns 0; pop returns 10" },
  ],
  starterFiles: {
    c: [
      { path: "ringbuf.h", content: RB_HEADER, editable: false },
      { path: "ringbuf.c", content: RB_STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "fifo_basic", visibility: "sample" },
    { name: "full_rejects", visibility: "hidden" },
    { name: "empty_pop", visibility: "hidden" },
    { name: "wraparound", visibility: "hidden" },
    { name: "stress_random", visibility: "hidden" },
  ],
  followUps: [
    "How would you make this lock-free for a single producer and single consumer?",
    "Why is a power-of-two capacity convenient? (hint: masking vs modulo)",
    "Where could false sharing hurt a concurrent version?",
  ],
  triviaTags: ["false-sharing"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
