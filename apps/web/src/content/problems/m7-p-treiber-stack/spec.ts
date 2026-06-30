import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef TSTACK_H
#define TSTACK_H
#include <stdatomic.h>
typedef struct ts_node { struct ts_node *next; long value; } ts_node_t;
typedef struct { _Atomic(ts_node_t *) head; } tstack_t;
void ts_init(tstack_t *s);
void ts_push(tstack_t *s, ts_node_t *n);   /* n->value preset */
ts_node_t *ts_pop(tstack_t *s);            /* NULL if empty */
#endif
`;

const STARTER = `#include "tstack.h"

void ts_init(tstack_t *s) { atomic_store(&s->head, (ts_node_t *)0); }

void ts_push(tstack_t *s, ts_node_t *n) {
  /* TODO (CAS loop): do { n->next = atomic_load(&s->head); }
     while (!atomic_compare_exchange_weak(&s->head, &n->next, n)); */
}

ts_node_t *ts_pop(tstack_t *s) {
  /* TODO (CAS loop): load head; if NULL return NULL; CAS head -> head->next; return old head. */
  return (void *)0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m7-p-treiber-stack",
  title: "Lock-Free Treiber Stack",
  difficulty: "hard",
  topicTags: ["concurrency", "lock-free", "atomics", "c"],
  moduleId: "m7-concurrency",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement ts_push/ts_pop in tstack.c (init provided).",
  constraints: "Lock-free push/pop via CAS on the head pointer. Multiple producers and consumers.",
  examples: [{ title: "LIFO", body: "concurrent pushes then concurrent pops return every value exactly once" }],
  starterFiles: {
    c: [
      { path: "tstack.h", content: HEADER, editable: false },
      { path: "tstack.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "concurrency",
  limits: { cpuSec: 8, wallSec: 18, memoryKb: 524288 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["tsan"], seeds: [1, 7] },
  tests: [
    { name: "single", visibility: "sample" },
    { name: "concurrent_push", visibility: "hidden" },
    { name: "concurrent_pop", visibility: "hidden" },
    { name: "push_pop_sum", visibility: "hidden" },
    { name: "stress", visibility: "hidden" },
  ],
  followUps: [
    "Where would the ABA problem appear if popped nodes were freed and reused?",
    "How do tagged pointers or hazard pointers make reclamation safe?",
  ],
  triviaTags: ["aba-problem", "cas", "memory-ordering"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
