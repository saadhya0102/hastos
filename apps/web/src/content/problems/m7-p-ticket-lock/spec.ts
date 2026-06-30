import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef TICKET_H
#define TICKET_H
#include <stdatomic.h>
typedef struct { atomic_uint next; atomic_uint serving; } ticket_t;
void ticket_init(ticket_t *t);
void ticket_lock(ticket_t *t);
void ticket_unlock(ticket_t *t);
#endif
`;

const STARTER = `#include "ticket.h"

void ticket_init(ticket_t *t) {
  atomic_store(&t->next, 0u);
  atomic_store(&t->serving, 0u);
}

void ticket_lock(ticket_t *t) {
  /* TODO: take a ticket = atomic_fetch_add(&t->next, 1);
     spin until atomic_load(&t->serving) == my ticket (acquire). */
}

void ticket_unlock(ticket_t *t) {
  /* TODO: advance serving by 1 (release) so the next ticket holder proceeds. */
}
`;

const problem: ProblemDef = defineProblem({
  id: "m7-p-ticket-lock",
  title: "Ticket Lock (fair)",
  difficulty: "medium",
  topicTags: ["concurrency", "atomics", "locks", "c"],
  moduleId: "m7-concurrency",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement ticket_lock/ticket_unlock in ticket.c (init provided).",
  constraints: "FIFO-fair lock using two atomic counters (ticket dispenser + now-serving).",
  examples: [{ title: "Exclusion", body: "threads increment a shared counter under the lock; total is exact and acquisition is in FIFO order" }],
  starterFiles: {
    c: [
      { path: "ticket.h", content: HEADER, editable: false },
      { path: "ticket.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "concurrency",
  limits: { cpuSec: 6, wallSec: 15, memoryKb: 262144 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["tsan"], seeds: [1] },
  tests: [
    { name: "single", visibility: "sample" },
    { name: "two_threads", visibility: "hidden" },
    { name: "four_threads", visibility: "hidden" },
    { name: "high_contention", visibility: "hidden" },
    { name: "reacquire", visibility: "hidden" },
  ],
  followUps: [
    "How does a ticket lock guarantee fairness that a test-and-set spinlock does not?",
    "What is the cache-coherence cost of all threads spinning on the same 'serving' word?",
  ],
  triviaTags: ["mutex-vs-spinlock"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
