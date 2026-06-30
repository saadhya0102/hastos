import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef ARENA_H
#define ARENA_H
#include <stddef.h>

typedef struct {
  char *base;
  size_t size;
  size_t used;
} arena_t;

/* Set up the arena over a caller-provided buffer of \`size\` bytes. */
void arena_init(arena_t *a, void *buf, size_t size);
/* Bump-allocate n bytes, 8-byte aligned. Return NULL if there is not enough room. */
void *arena_alloc(arena_t *a, size_t n);
/* Reclaim everything at once. */
void arena_reset(arena_t *a);

#endif
`;

const STARTER = `#include "arena.h"

void arena_init(arena_t *a, void *buf, size_t size) {
  /* TODO: store base/size, set used = 0. */
}

void *arena_alloc(arena_t *a, size_t n) {
  /* TODO: align used up to a multiple of 8; if aligned_off + n > size return NULL;
     otherwise advance used and return base + aligned_off. */
  return NULL;
}

void arena_reset(arena_t *a) {
  /* TODO: set used back to 0. */
}
`;

const problem: ProblemDef = defineProblem({
  id: "m6-p-arena",
  title: "Arena (Bump) Allocator",
  difficulty: "medium",
  topicTags: ["memory", "allocator", "c"],
  moduleId: "m6-virtual-memory",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement arena_init/arena_alloc/arena_reset in arena.c (no main).",
  constraints: "8-byte alignment. Return NULL when the request doesn't fit. reset reclaims all.",
  examples: [
    { title: "Bump", body: "two allocs return increasing, non-overlapping, 8-aligned pointers" },
    { title: "Full", body: "an allocation larger than the remaining space returns NULL" },
  ],
  starterFiles: {
    c: [
      { path: "arena.h", content: HEADER, editable: false },
      { path: "arena.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "basic_alloc", visibility: "sample" },
    { name: "alignment", visibility: "hidden" },
    { name: "out_of_room", visibility: "hidden" },
    { name: "exhaust", visibility: "hidden" },
    { name: "reset_reuse", visibility: "hidden" },
  ],
  followUps: [
    "Why can't an arena free individual objects?",
    "When is an arena dramatically better than general malloc?",
  ],
  triviaTags: ["malloc-alignment"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
