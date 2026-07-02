import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef MYMEMMOVE_H
#define MYMEMMOVE_H
#include <stddef.h>

/* Copy n bytes from src to dst, correctly even if the regions overlap. Return dst. */
void *my_memmove(void *dst, const void *src, size_t n);

#endif
`;

const STARTER = `#include "mymemmove.h"

void *my_memmove(void *dst, const void *src, size_t n) {
  /* TODO: copy n bytes from src to dst, handling overlap.
     Hint: if dst < src, copy front-to-back; if dst > src, copy back-to-front.
     Cast to unsigned char * so pointer arithmetic moves one byte at a time. */
  return dst;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m0-p-memmove",
  title: "Implement my_memmove",
  difficulty: "medium",
  topicTags: ["c", "pointers", "memory"],
  moduleId: "m0-orientation",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement my_memmove in mymemmove.c (no main).",
  constraints:
    "Regions may overlap. n may be 0. Must return dst. Do not call the library memmove/memcpy.",
  examples: [
    { title: "Overlap forward", body: 'buf="abcdef"; my_memmove(buf+2, buf, 4) -> "ababcd"' },
    { title: "Overlap backward", body: 'buf="abcdef"; my_memmove(buf, buf+2, 4) -> "cdefef"' },
  ],
  starterFiles: {
    c: [
      { path: "mymemmove.h", content: HEADER, editable: false },
      { path: "mymemmove.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 3, wallSec: 8, memoryKb: 131072 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "overlap_forward", visibility: "sample" },
    { name: "overlap_backward", visibility: "hidden" },
    { name: "no_overlap", visibility: "hidden" },
    { name: "zero_bytes", visibility: "hidden" },
    { name: "large", visibility: "hidden" },
  ],
  followUps: [
    "Why can a naive front-to-back copy corrupt data when dst > src and the regions overlap?",
    "How does the standard library decide the copy direction, and how could you copy word-at-a-time?",
  ],
  triviaTags: ["memcpy-memmove"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
