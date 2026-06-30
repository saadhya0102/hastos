import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef ACOUNTER_H
#define ACOUNTER_H
#include <stdatomic.h>
typedef struct { atomic_long v; } counter_t;
void counter_init(counter_t *c);
void counter_inc(counter_t *c);
long counter_get(counter_t *c);
#endif
`;

const STARTER = `#include "acounter.h"

void counter_init(counter_t *c) { atomic_store(&c->v, 0); }

void counter_inc(counter_t *c) {
  /* TODO: atomically add 1 (atomic_fetch_add). */
}

long counter_get(counter_t *c) {
  /* TODO: atomically load the value. */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m7-p-atomic-counter",
  title: "Atomic Counter",
  difficulty: "easy",
  topicTags: ["concurrency", "atomics", "c"],
  moduleId: "m7-concurrency",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement counter_inc/counter_get in acounter.c (init provided).",
  constraints: "Use C11 atomics so concurrent increments never lose updates.",
  examples: [{ title: "Exact", body: "N threads each increment M times; the total is exactly N*M" }],
  starterFiles: {
    c: [
      { path: "acounter.h", content: HEADER, editable: false },
      { path: "acounter.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "concurrency",
  limits: { cpuSec: 6, wallSec: 15, memoryKb: 262144 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["tsan"], seeds: [1] },
  tests: [
    { name: "single", visibility: "sample" },
    { name: "two_threads", visibility: "hidden" },
    { name: "four_threads", visibility: "hidden" },
    { name: "eight_threads", visibility: "hidden" },
    { name: "get_value", visibility: "hidden" },
  ],
  followUps: [
    "Why is atomic_fetch_add a single indivisible operation, unlike v++?",
    "When would memory_order_relaxed be acceptable for a counter?",
  ],
  triviaTags: ["volatile-not-atomic"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
