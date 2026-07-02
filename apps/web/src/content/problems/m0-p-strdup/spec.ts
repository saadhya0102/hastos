import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef MYSTRDUP_H
#define MYSTRDUP_H

/* Allocate a copy of s (including the terminator) and return it. Caller frees. */
char *my_strdup(const char *s);

#endif
`;

const STARTER = `#include "mystrdup.h"
#include <stdlib.h>
#include <string.h>

char *my_strdup(const char *s) {
  /* TODO: allocate strlen(s) + 1 bytes, copy the string (with its '\\0'),
     and return the new pointer. The caller is responsible for free(). */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m0-p-strdup",
  title: "Implement my_strdup",
  difficulty: "easy",
  topicTags: ["c", "strings", "memory"],
  moduleId: "m0-orientation",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement my_strdup in mystrdup.c (no main).",
  constraints:
    "Allocate exactly strlen(s)+1 bytes. The copy must be independent and freeable. Don't leak.",
  examples: [
    { title: "Copy", body: 'my_strdup("hello") returns a new "hello" you can free' },
    { title: "Independent", body: "modifying the copy must not change the original" },
  ],
  starterFiles: {
    c: [
      { path: "mystrdup.h", content: HEADER, editable: false },
      { path: "mystrdup.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 3, wallSec: 8, memoryKb: 131072 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "basic", visibility: "sample" },
    { name: "distinct", visibility: "hidden" },
    { name: "empty", visibility: "hidden" },
    { name: "independent", visibility: "hidden" },
    { name: "long", visibility: "hidden" },
  ],
  followUps: [
    "Why must you allocate strlen(s) + 1 rather than strlen(s)?",
    "What should my_strdup do if malloc returns NULL?",
  ],
  triviaTags: [],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
