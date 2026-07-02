import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef VEC_H
#define VEC_H
#include <stddef.h>

typedef struct {
  int *data;
  size_t len;   /* number of elements */
  size_t cap;   /* allocated capacity */
} vec_t;

void vec_init(vec_t *v);              /* start empty */
void vec_push(vec_t *v, int x);       /* append, growing (doubling) when full */
int vec_get(const vec_t *v, size_t i);/* element at index i (0 <= i < len) */
size_t vec_len(const vec_t *v);       /* current length */
void vec_free(vec_t *v);              /* release storage and reset to empty */

#endif
`;

const STARTER = `#include "vec.h"
#include <stdlib.h>

void vec_init(vec_t *v) {
  /* TODO: start empty (data = NULL, len = 0, cap = 0). */
}

void vec_push(vec_t *v, int x) {
  /* TODO: if len == cap, grow cap (0 -> 1, else double) with realloc; then append. */
}

int vec_get(const vec_t *v, size_t i) {
  /* TODO: return the element at index i. */
  return 0;
}

size_t vec_len(const vec_t *v) {
  /* TODO */
  return 0;
}

void vec_free(vec_t *v) {
  /* TODO: free(data) and reset fields so the vector can be reused. */
}
`;

const problem: ProblemDef = defineProblem({
  id: "ds-dynamic-array",
  title: "Dynamic Array (growable vector)",
  difficulty: "medium",
  topicTags: ["data-structures", "memory", "amortized"],
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement the vec_* functions in vec.c (no main).",
  constraints:
    "Amortized O(1) push via geometric growth (doubling). No leaks. vec_free must allow re-init.",
  examples: [
    { title: "Push/get", body: "push 10,20,30 -> len 3, get(1) == 20" },
    { title: "Growth", body: "after 1000 pushes, len == 1000 and cap >= len" },
  ],
  starterFiles: {
    c: [
      { path: "vec.h", content: HEADER, editable: false },
      { path: "vec.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 3, wallSec: 8, memoryKb: 131072 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "push_get", visibility: "sample" },
    { name: "empty", visibility: "hidden" },
    { name: "many", visibility: "hidden" },
    { name: "grows", visibility: "hidden" },
    { name: "reuse", visibility: "hidden" },
  ],
  followUps: [
    "Why does doubling give amortized O(1) push while growing by a constant gives O(n)?",
    "What growth factor does CPython / Go / C++ std::vector use, and why less than 2x sometimes?",
  ],
  triviaTags: ["amortized", "data-structures"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
