import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef MYATOI_H
#define MYATOI_H
/* Parse an optional +/- sign followed by decimal digits. Stop at the first non-digit.
   No leading whitespace handling required. Assume the value fits in int. */
int my_atoi(const char *s);
#endif
`;
const STARTER = `#include "myatoi.h"

int my_atoi(const char *s) {
  /* TODO: read an optional '+'/'-', then accumulate digits (val = val*10 + (c - '0')) until a
     non-digit; apply the sign. */
  return 0;
}
`;
const problem: ProblemDef = defineProblem({
  id: "m0-p-atoi", title: "Implement my_atoi", difficulty: "easy",
  topicTags: ["c", "parsing"], moduleId: "m0-orientation", interview: true,
  allowedLanguages: ["c"], statementMdx: "./statement.mdx",
  signatureNote: "Implement my_atoi in myatoi.c (no main).",
  constraints: "Optional sign then digits; stop at first non-digit. Assume it fits in int. No library atoi.",
  examples: [{ title: "Signed", body: 'my_atoi("-45") == -45; my_atoi("42abc") == 42' }],
  starterFiles: { c: [{ path: "myatoi.h", content: HEADER, editable: false }, { path: "myatoi.c", content: STARTER, editable: true }] },
  gradingMode: "harness", limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "digits", visibility: "sample" },
    { name: "negative", visibility: "hidden" },
    { name: "plus", visibility: "hidden" },
    { name: "trailing", visibility: "hidden" },
    { name: "zero", visibility: "hidden" },
  ],
  followUps: ["How would you detect overflow and handle it (like strtol does)?"],
  triviaTags: [], hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});
export default problem;
