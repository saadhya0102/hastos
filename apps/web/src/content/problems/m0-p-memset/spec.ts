import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef MYMEMSET_H
#define MYMEMSET_H
#include <stddef.h>
/* Fill n bytes at dst with the byte value (unsigned char)c. Return dst. */
void *my_memset(void *dst, int c, size_t n);
#endif
`;
const STARTER = `#include "mymemset.h"

void *my_memset(void *dst, int c, size_t n) {
  /* TODO: write (unsigned char)c into the first n bytes of dst; return dst. */
  return dst;
}
`;
const problem: ProblemDef = defineProblem({
  id: "m0-p-memset", title: "Implement my_memset", difficulty: "easy",
  topicTags: ["c", "memory"], moduleId: "m0-orientation", interview: true,
  allowedLanguages: ["c"], statementMdx: "./statement.mdx",
  signatureNote: "Implement my_memset in mymemset.c (no main).",
  constraints: "Fill n bytes with (unsigned char)c; return dst. n may be 0. No library memset.",
  examples: [{ title: "Fill", body: 'set 5 bytes to \'A\' -> "AAAAA"' }],
  starterFiles: { c: [{ path: "mymemset.h", content: HEADER, editable: false }, { path: "mymemset.c", content: STARTER, editable: true }] },
  gradingMode: "harness", limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "fill_char", visibility: "sample" },
    { name: "returns_dst", visibility: "hidden" },
    { name: "zero_n", visibility: "hidden" },
    { name: "fill_zero", visibility: "hidden" },
    { name: "partial", visibility: "hidden" },
  ],
  followUps: ["Why does memset take an int for the byte value but only use its low 8 bits?"],
  triviaTags: [], hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});
export default problem;
