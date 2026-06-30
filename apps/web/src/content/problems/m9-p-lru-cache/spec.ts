import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef LRU_H
#define LRU_H
/* A fixed-capacity LRU cache over caller-provided storage arrays (each length cap). */
typedef struct {
  int cap, size;
  int *keys;     /* keys[i]  */
  int *vals;     /* vals[i]  */
  long *used;    /* used[i] = recency timestamp of entry i */
  long tick;     /* monotonically increasing clock */
} lru_t;

void lru_init(lru_t *c, int *keys, int *vals, long *used, int cap);
/* Return the value for key, marking it most-recently-used; -1 if absent. */
int lru_get(lru_t *c, int key);
/* Insert or update key->value; if at capacity, evict the least-recently-used entry. */
void lru_put(lru_t *c, int key, int value);

#endif
`;

const STARTER = `#include "lru.h"

void lru_init(lru_t *c, int *keys, int *vals, long *used, int cap) {
  c->cap = cap; c->size = 0; c->keys = keys; c->vals = vals; c->used = used; c->tick = 0;
}

int lru_get(lru_t *c, int key) {
  /* TODO: find key among the first 'size' entries; if found, set its used = ++tick and return val;
     else return -1. */
  return -1;
}

void lru_put(lru_t *c, int key, int value) {
  /* TODO: if key exists, update value and recency; else if size < cap append; else replace the
     entry with the smallest 'used' (the least-recently-used) with the new key/value/recency. */
}
`;

const problem: ProblemDef = defineProblem({
  id: "m9-p-lru-cache",
  title: "LRU Cache",
  difficulty: "medium",
  topicTags: ["cache", "data-structures", "c"],
  moduleId: "m9-filesystems",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement lru_get/lru_put in lru.c (init provided).",
  constraints: "Fixed capacity. get returns -1 if absent. put evicts the least-recently-used on overflow.",
  examples: [
    { title: "Evict", body: "cap 2: put(1,10),put(2,20),get(1),put(3,30) -> key 2 is evicted" },
  ],
  starterFiles: {
    c: [
      { path: "lru.h", content: HEADER, editable: false },
      { path: "lru.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "get_miss", visibility: "sample" },
    { name: "put_get", visibility: "hidden" },
    { name: "update", visibility: "hidden" },
    { name: "evict_lru", visibility: "hidden" },
    { name: "capacity", visibility: "hidden" },
  ],
  followUps: [
    "How would you make get/put O(1) with a hash map + doubly linked list?",
    "How would you add thread safety, and where's the contention?",
  ],
  triviaTags: ["clock-algo"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
