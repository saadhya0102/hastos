import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef STRREV_H
#define STRREV_H

/* Reverse a null-terminated string in place. */
void str_reverse(char *s);

#endif
`;

const STARTER = `#include "strrev.h"

void str_reverse(char *s) {
  /* TODO: reverse the characters in place (do not use a second buffer).
     Hint: two indices, one from each end, swap and walk inward. */
}
`;

const problem: ProblemDef = defineProblem({
  id: "m0-p-strrev",
  title: "Reverse a string in place",
  difficulty: "easy",
  topicTags: ["c", "strings", "pointers"],
  moduleId: "m0-orientation",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement str_reverse in strrev.c (no main).",
  constraints: "Reverse in place (no second buffer). Handle empty and single-char strings.",
  examples: [
    { title: "Basic", body: '"hello" -> "olleh"' },
    { title: "Edges", body: '"" -> ""; "a" -> "a"; "racecar" -> "racecar"' },
  ],
  starterFiles: {
    c: [
      { path: "strrev.h", content: HEADER, editable: false },
      { path: "strrev.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "basic", visibility: "sample" },
    { name: "empty", visibility: "hidden" },
    { name: "single", visibility: "hidden" },
    { name: "even", visibility: "hidden" },
    { name: "odd", visibility: "hidden" },
    { name: "palindrome", visibility: "hidden" },
  ],
  followUps: [
    "How would you reverse only the words in a sentence, keeping word order's characters intact?",
    "What changes if the string is UTF-8 and you must reverse by code point, not byte?",
  ],
  triviaTags: [],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
