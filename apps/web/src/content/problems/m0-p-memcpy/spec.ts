import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef MYMEMCPY_H
#define MYMEMCPY_H
#include <stddef.h>

/* Copy n bytes from src to dst (non-overlapping). Return dst. */
void *my_memcpy(void *dst, const void *src, size_t n);

#endif
`;

const STARTER = `#include "mymemcpy.h"

void *my_memcpy(void *dst, const void *src, size_t n) {
  /* TODO: copy n bytes from src to dst, one byte at a time, then return dst.
     Hint: cast to unsigned char * so pointer arithmetic moves by single bytes. */
  return dst;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m0-p-memcpy",
  title: "Implement my_memcpy",
  difficulty: "easy",
  topicTags: ["c", "pointers", "memory"],
  moduleId: "m0-orientation",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement my_memcpy in mymemcpy.c (no main).",
  constraints: "Regions do not overlap. n may be 0. Must return dst. Do not use the library memcpy.",
  examples: [
    { title: "Copy", body: 'copy 5 bytes "hello" into a buffer -> buffer holds "hello"' },
    { title: "Zero", body: "n = 0 copies nothing and returns dst unchanged" },
  ],
  starterFiles: {
    c: [
      { path: "mymemcpy.h", content: HEADER, editable: false },
      { path: "mymemcpy.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "basic_copy", visibility: "sample" },
    { name: "zero_bytes", visibility: "hidden" },
    { name: "returns_dst", visibility: "hidden" },
    { name: "binary_data", visibility: "hidden" },
    { name: "large_copy", visibility: "hidden" },
  ],
  followUps: [
    "Why is overlapping memory a problem here, and what function handles it correctly?",
    "How could you copy multiple bytes at a time to go faster, and what alignment issues arise?",
  ],
  triviaTags: ["malloc-alignment"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
