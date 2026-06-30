import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef MYSTRLEN_H
#define MYSTRLEN_H
#include <stddef.h>

/* Return the number of characters before the terminating '\\0'. */
size_t my_strlen(const char *s);

#endif
`;

const STARTER = `#include "mystrlen.h"

size_t my_strlen(const char *s) {
  /* TODO: walk from s until you reach the '\\0' terminator; return the count. */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m0-p-strlen",
  title: "Implement my_strlen",
  difficulty: "easy",
  topicTags: ["c", "pointers", "strings"],
  moduleId: "m0-orientation",
  interview: false,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement my_strlen in mystrlen.c (no main).",
  constraints: "Input is a valid null-terminated C string (possibly empty). Do not use the library strlen.",
  examples: [
    { title: "Empty", body: 'my_strlen("") returns 0' },
    { title: "Word", body: 'my_strlen("hello") returns 5' },
  ],
  starterFiles: {
    c: [
      { path: "mystrlen.h", content: HEADER, editable: false },
      { path: "mystrlen.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "empty", visibility: "sample" },
    { name: "single_char", visibility: "hidden" },
    { name: "hello", visibility: "hidden" },
    { name: "with_spaces", visibility: "hidden" },
    { name: "long_string", visibility: "hidden" },
  ],
  followUps: [
    "How would the function change if strings were length-prefixed instead of null-terminated?",
    "What is the time complexity, and can it be improved for very long strings?",
  ],
  triviaTags: ["stack-grows-down"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
