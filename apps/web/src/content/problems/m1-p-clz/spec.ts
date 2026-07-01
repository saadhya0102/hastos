import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef CLZ_H
#define CLZ_H
#include <stdint.h>
/* Count leading zero bits of x. count_leading_zeros(0) == 32. */
int count_leading_zeros(uint32_t x);
#endif
`;
const STARTER = `#include "clz.h"

int count_leading_zeros(uint32_t x) {
  /* TODO: if x==0 return 32; else count how many high bits are 0 before the top set bit.
     Do NOT use __builtin_clz. */
  return 32;
}
`;
const problem: ProblemDef = defineProblem({
  id: "m1-p-clz",
  title: "Count Leading Zeros",
  difficulty: "easy",
  topicTags: ["bits", "c"],
  moduleId: "m1-data",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement count_leading_zeros in clz.c (no main).",
  constraints: "32-bit. clz(0)=32. Do not use __builtin_clz.",
  examples: [{ title: "One", body: "count_leading_zeros(1) == 31" }],
  starterFiles: { c: [{ path: "clz.h", content: HEADER, editable: false }, { path: "clz.c", content: STARTER, editable: true }] },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "one", visibility: "sample" },
    { name: "zero", visibility: "hidden" },
    { name: "top_bit", visibility: "hidden" },
    { name: "byte", visibility: "hidden" },
    { name: "all_ones", visibility: "hidden" },
  ],
  followUps: ["How does 31 - clz(x) give floor(log2(x)), and where is that used in allocators?"],
  triviaTags: [],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});
export default problem;
