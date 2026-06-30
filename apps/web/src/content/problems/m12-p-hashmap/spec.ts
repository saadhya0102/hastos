import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef KVMAP_H
#define KVMAP_H
/* Open-addressing hash map (linear probing with tombstones) over caller-provided arrays.
   state[i]: 0 = empty, 1 = occupied, 2 = tombstone. */
typedef struct {
  int *keys; int *vals; char *state;
  int cap; int size;
} kvmap_t;

void kv_init(kvmap_t *m, int *keys, int *vals, char *state, int cap);
void kv_put(kvmap_t *m, int key, int val);          /* insert or overwrite */
int kv_get(kvmap_t *m, int key, int *found);        /* sets *found 0/1; returns value if found */
void kv_del(kvmap_t *m, int key);                   /* tombstone the slot if present */

#endif
`;

const STARTER = `#include "kvmap.h"

void kv_init(kvmap_t *m, int *keys, int *vals, char *state, int cap) {
  m->keys = keys; m->vals = vals; m->state = state; m->cap = cap; m->size = 0;
  for (int i = 0; i < cap; i++) state[i] = 0;   /* all empty */
}

static int hash_index(int key, int cap) { return (int)((unsigned)key % (unsigned)cap); }

void kv_put(kvmap_t *m, int key, int val) {
  /* TODO: linear-probe from hash_index. If you hit an occupied slot with the same key, overwrite.
     Otherwise insert at the first empty/tombstone slot (size++). Assume the table is not full. */
}

int kv_get(kvmap_t *m, int key, int *found) {
  /* TODO: probe from hash_index; while the slot is not empty, if it's occupied with this key,
     set *found=1 and return its value; keep probing past tombstones/other keys.
     At an empty slot, set *found=0 and return 0. */
  *found = 0; return 0;
}

void kv_del(kvmap_t *m, int key) {
  /* TODO: find the key like kv_get; if occupied with this key, mark it tombstone (state=2) and size--. */
}
`;

const problem: ProblemDef = defineProblem({
  id: "m12-p-hashmap",
  title: "Open-Addressing Hash Map",
  difficulty: "hard",
  topicTags: ["data-structures", "hashing", "c"],
  moduleId: "m12-capstone",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement kv_put/kv_get/kv_del in kvmap.c (kv_init provided).",
  constraints: "Linear probing with tombstones. Probes must continue past tombstones. Assume the table is not full.",
  examples: [
    { title: "Collision", body: "cap 4: keys 1 and 5 collide; both are stored and retrievable" },
    { title: "Delete + probe", body: "deleting a colliding key still lets you find the other (tombstone)" },
  ],
  starterFiles: {
    c: [
      { path: "kvmap.h", content: HEADER, editable: false },
      { path: "kvmap.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "put_get", visibility: "sample" },
    { name: "missing", visibility: "hidden" },
    { name: "overwrite", visibility: "hidden" },
    { name: "collision", visibility: "hidden" },
    { name: "delete_probe", visibility: "hidden" },
  ],
  followUps: [
    "Why must delete use a tombstone instead of clearing the slot to empty?",
    "How would you resize/rehash when the load factor gets high, and make it thread-safe?",
  ],
  triviaTags: [],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
