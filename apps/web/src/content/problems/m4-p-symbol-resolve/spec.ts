import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef SYMRESOLVE_H
#define SYMRESOLVE_H
/*
 * Model the linker's resolution of ONE global symbol.
 *   strong_defs: number of strong definitions (functions / initialized globals)
 *   weak_defs:   number of weak definitions (uninitialized globals)
 * Return:
 *    0  if it resolves to exactly one definition (OK)
 *   -1  if there are multiple strong definitions (multiple-definition error)
 *   -2  if there is no definition at all (undefined reference)
 */
int resolve_symbol(int strong_defs, int weak_defs);
#endif
`;

const STARTER = `#include "symresolve.h"

int resolve_symbol(int strong_defs, int weak_defs) {
  /* TODO: apply the linker rules:
       >=2 strong            -> -1 (multiple definition)
       exactly 1 strong      ->  0 (strong wins, weaks ignored)
       0 strong, >=1 weak    ->  0 (a weak is chosen)
       0 strong, 0 weak      -> -2 (undefined reference) */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m4-p-symbol-resolve",
  title: "Linker Symbol Resolution",
  difficulty: "easy",
  topicTags: ["linking", "symbols", "c"],
  moduleId: "m4-linking",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement resolve_symbol in symresolve.c (no main).",
  constraints: "Inputs are non-negative counts. Encode the three linker rules exactly.",
  examples: [
    { title: "Strong wins", body: "resolve_symbol(1, 2) returns 0" },
    { title: "Conflict", body: "resolve_symbol(2, 0) returns -1" },
  ],
  starterFiles: {
    c: [
      { path: "symresolve.h", content: HEADER, editable: false },
      { path: "symresolve.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "one_strong", visibility: "sample" },
    { name: "one_weak", visibility: "hidden" },
    { name: "strong_wins", visibility: "hidden" },
    { name: "multiple_strong", visibility: "hidden" },
    { name: "undefined", visibility: "hidden" },
  ],
  followUps: [
    "Why is binding a weak int to a strong double so dangerous?",
    "How does -fno-common change the treatment of tentative (weak) definitions?",
  ],
  triviaTags: ["strong-weak-symbols"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
