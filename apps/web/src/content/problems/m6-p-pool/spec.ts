import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef POOL_H
#define POOL_H
#include <stddef.h>

typedef struct {
  void *free_list;     /* head of the singly-linked free list */
  size_t block_size;
} pool_t;

/* Initialize a pool over buf of buf_size bytes, carved into fixed blocks of block_size
   (block_size >= sizeof(void*); buf is suitably aligned). Thread all blocks onto the free list. */
void pool_init(pool_t *p, void *buf, size_t buf_size, size_t block_size);
/* Return one free block, or NULL if exhausted. O(1). */
void *pool_alloc(pool_t *p);
/* Return a block to the pool. O(1). */
void pool_free(pool_t *p, void *blk);

#endif
`;

const STARTER = `#include "pool.h"

void pool_init(pool_t *p, void *buf, size_t buf_size, size_t block_size) {
  /* TODO: thread every block onto the free list. Store each block's 'next' pointer
     in the first bytes of the block: *(void **)block = next_block. */
}

void *pool_alloc(pool_t *p) {
  /* TODO: pop the head of the free list (read *(void**)head for the next), or NULL if empty. */
  return NULL;
}

void pool_free(pool_t *p, void *blk) {
  /* TODO: push blk onto the free list (store old head in *(void**)blk, set head = blk). */
}
`;

const problem: ProblemDef = defineProblem({
  id: "m6-p-pool",
  title: "Pool (Slab) Allocator",
  difficulty: "medium",
  topicTags: ["memory", "allocator", "free-list", "c"],
  moduleId: "m6-virtual-memory",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement pool_init/pool_alloc/pool_free in pool.c (no main).",
  constraints: "Fixed-size blocks; O(1) alloc/free via an in-block free list. block_size >= sizeof(void*).",
  examples: [
    { title: "Reuse", body: "alloc all blocks, free one, then alloc returns a block again" },
    { title: "Exhaust", body: "after allocating every block, the next alloc returns NULL" },
  ],
  starterFiles: {
    c: [
      { path: "pool.h", content: HEADER, editable: false },
      { path: "pool.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "alloc_one", visibility: "sample" },
    { name: "distinct_blocks", visibility: "hidden" },
    { name: "exhaust", visibility: "hidden" },
    { name: "free_reuse", visibility: "hidden" },
    { name: "refill", visibility: "hidden" },
  ],
  followUps: [
    "Why is there no external fragmentation in a fixed-size pool?",
    "How is this the same idea as a segregated free list / the Linux slab allocator?",
  ],
  triviaTags: ["malloc-alignment"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
