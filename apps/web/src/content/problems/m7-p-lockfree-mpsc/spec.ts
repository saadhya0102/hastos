import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef MPSC_H
#define MPSC_H
#include <stdatomic.h>

typedef struct mpsc_node {
  _Atomic(struct mpsc_node *) next;
  long value;
} mpsc_node_t;

typedef struct {
  _Atomic(mpsc_node_t *) head;  /* producers append here */
  mpsc_node_t *tail;            /* single consumer reads here */
  mpsc_node_t stub;             /* initial dummy node */
} mpsc_t;

void mpsc_init(mpsc_t *q);
/* Multi-producer: append node n (n->value already set). */
void mpsc_enqueue(mpsc_t *q, mpsc_node_t *n);
/* Single-consumer: return a node carrying the next value, or NULL if none available. */
mpsc_node_t *mpsc_dequeue(mpsc_t *q);

#endif
`;

const STARTER = `#include "mpsc.h"

void mpsc_init(mpsc_t *q) {
  atomic_store_explicit(&q->stub.next, NULL, memory_order_relaxed);
  atomic_store_explicit(&q->head, &q->stub, memory_order_relaxed);
  q->tail = &q->stub;
}

void mpsc_enqueue(mpsc_t *q, mpsc_node_t *n) {
  /* TODO (Vyukov MPSC):
     1) n->next = NULL (relaxed)
     2) prev = atomic_exchange(&q->head, n, acq_rel)   // atomically swing head to n
     3) prev->next = n (release)                        // link predecessor to n */
}

mpsc_node_t *mpsc_dequeue(mpsc_t *q) {
  /* TODO (single consumer):
     tail = q->tail; next = atomic_load(&tail->next, acquire);
     if (next) { q->tail = next; tail->value = next->value; return tail; }
     return NULL; */
  return (void *)0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m7-p-lockfree-mpsc",
  title: "Lock-Free MPSC Queue",
  difficulty: "hard",
  topicTags: ["concurrency", "lock-free", "atomics", "c"],
  moduleId: "m7-concurrency",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement mpsc_enqueue/mpsc_dequeue in mpsc.c (mpsc_init provided).",
  constraints: "Lock-free (no locks); many producers, exactly one consumer. Vyukov intrusive MPSC. Use correct memory orderings.",
  examples: [
    { title: "MPSC", body: "N producers each enqueue K distinct values; the single consumer receives all N*K exactly once" },
  ],
  starterFiles: {
    c: [
      { path: "mpsc.h", content: HEADER, editable: false },
      { path: "mpsc.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "concurrency",
  limits: { cpuSec: 8, wallSec: 18, memoryKb: 524288 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["tsan"], seeds: [1, 7, 42] },
  tests: [
    { name: "spsc_small", visibility: "sample" },
    { name: "mpsc_two", visibility: "hidden" },
    { name: "mpsc_four", visibility: "hidden" },
    { name: "per_producer_fifo", visibility: "hidden" },
    { name: "stress", visibility: "hidden" },
  ],
  followUps: [
    "Why does the exchange need acq_rel and the next-store need release?",
    "Why is single-consumer crucial here, and how would MPMC reintroduce the ABA/reclamation hazard?",
    "How would you add safe node reclamation (hazard pointers / epochs)?",
  ],
  triviaTags: ["aba-problem", "memory-ordering", "cas"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
