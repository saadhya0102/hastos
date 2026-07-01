import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef MYSTRCMP_H
#define MYSTRCMP_H
/* Compare two C strings. Return <0, 0, or >0 like the standard strcmp. */
int my_strcmp(const char *a, const char *b);
#endif
`;
const STARTER = `#include "mystrcmp.h"

int my_strcmp(const char *a, const char *b) {
  /* TODO: advance while *a == *b and not '\\0'; return the difference of the first differing bytes
     (compare as unsigned char). */
  return 0;
}
`;
const problem: ProblemDef = defineProblem({
  id: "m0-p-strcmp", title: "Implement my_strcmp", difficulty: "easy",
  topicTags: ["c", "strings"], moduleId: "m0-orientation", interview: true,
  allowedLanguages: ["c"], statementMdx: "./statement.mdx",
  signatureNote: "Implement my_strcmp in mystrcmp.c (no main).",
  constraints: "Return sign of first differing (unsigned char) bytes; 0 if equal. No library strcmp.",
  examples: [{ title: "Order", body: 'my_strcmp("abc","abd") < 0' }],
  starterFiles: { c: [{ path: "mystrcmp.h", content: HEADER, editable: false }, { path: "mystrcmp.c", content: STARTER, editable: true }] },
  gradingMode: "harness", limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "equal", visibility: "sample" },
    { name: "less", visibility: "hidden" },
    { name: "greater", visibility: "hidden" },
    { name: "prefix", visibility: "hidden" },
    { name: "empty", visibility: "hidden" },
  ],
  followUps: ["Why compare as unsigned char rather than signed char?"],
  triviaTags: [], hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});
export default problem;
