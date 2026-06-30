import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef CLOCKREPL_H
#define CLOCKREPL_H
/* CLOCK (second-chance) page replacement. Given num_frames and a reference string refs[n],
   return the number of page faults. Frames start empty; a reference bit is set on access. */
int clock_faults(int num_frames, const int *refs, int n);
#endif
`;

const STARTER = `#include "clockrepl.h"

int clock_faults(int num_frames, const int *refs, int n) {
  /* TODO:
     frames[] init to -1 (empty), ref[] init 0, hand = 0, faults = 0.
     For each page p:
       if p is already in a frame: set that frame's ref bit = 1 (hit); continue.
       fault++; advance the hand: while the frame at hand is occupied AND its ref bit is 1,
         clear that ref bit and move the hand forward (mod num_frames); stop at an empty frame
         or a frame with ref bit 0. Place p there, set its ref bit = 1, move the hand forward.
     You may assume num_frames <= 64. */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m9-p-clock",
  title: "CLOCK Page Replacement",
  difficulty: "medium",
  topicTags: ["caching", "virtual-memory", "os", "c"],
  moduleId: "m9-filesystems",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement clock_faults in clockrepl.c (no main).",
  constraints: "CLOCK/second-chance. Frames start empty. num_frames <= 64. Count page faults.",
  examples: [{ title: "Cold", body: "3 frames, refs [1,2,3] -> 3 faults (all compulsory)" }],
  starterFiles: {
    c: [
      { path: "clockrepl.h", content: HEADER, editable: false },
      { path: "clockrepl.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "all_compulsory", visibility: "sample" },
    { name: "with_repeat", visibility: "hidden" },
    { name: "simple_replace", visibility: "hidden" },
    { name: "hit_then_fault", visibility: "hidden" },
    { name: "loop", visibility: "hidden" },
  ],
  followUps: ["How does CLOCK approximate LRU, and where can it differ from true LRU?"],
  triviaTags: ["clock-algo"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
