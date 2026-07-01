import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef MYSTRCHR_H
#define MYSTRCHR_H
/* Return a pointer to the first occurrence of (char)c in s, or NULL if not present.
   Searching for '\\0' returns a pointer to the terminator. */
char *my_strchr(const char *s, int c);
#endif
`;
const STARTER = `#include "mystrchr.h"

char *my_strchr(const char *s, int c) {
  /* TODO: scan s; return the address of the first byte equal to (char)c (including the '\\0'
     terminator if c == 0); return NULL if not found. */
  return (void *)0;
}
`;
const problem: ProblemDef = defineProblem({
  id: "m0-p-strchr", title: "Implement my_strchr", difficulty: "easy",
  topicTags: ["c", "strings", "pointers"], moduleId: "m0-orientation", interview: true,
  allowedLanguages: ["c"], statementMdx: "./statement.mdx",
  signatureNote: "Implement my_strchr in mystrchr.c (no main).",
  constraints: "Return pointer to first (char)c, or NULL. Searching '\\0' returns the terminator. No library strchr.",
  examples: [{ title: "Find", body: 'my_strchr("hello", \'l\') points at index 2' }],
  starterFiles: { c: [{ path: "mystrchr.h", content: HEADER, editable: false }, { path: "mystrchr.c", content: STARTER, editable: true }] },
  gradingMode: "harness", limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "found", visibility: "sample" },
    { name: "first_occurrence", visibility: "hidden" },
    { name: "not_found", visibility: "hidden" },
    { name: "terminator", visibility: "hidden" },
    { name: "at_start", visibility: "hidden" },
  ],
  followUps: ["Why does searching for '\\0' succeed and return the terminator's address?"],
  triviaTags: [], hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});
export default problem;
