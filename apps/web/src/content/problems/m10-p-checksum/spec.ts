import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef ICHECKSUM_H
#define ICHECKSUM_H
/* The 16-bit one's-complement Internet checksum (RFC 1071) over len bytes.
   Words are big-endian: word = (data[i] << 8) | data[i+1]. Pad a final odd byte with 0. */
unsigned short inet_checksum(const unsigned char *data, int len);
#endif
`;

const STARTER = `#include "ichecksum.h"

unsigned short inet_checksum(const unsigned char *data, int len) {
  /* TODO:
     sum = 0 (use a 32-bit accumulator);
     for each 16-bit big-endian word: sum += word;
     if len is odd, the last word is (data[last] << 8);
     fold carries: while (sum >> 16) sum = (sum & 0xFFFF) + (sum >> 16);
     return (unsigned short)(~sum). */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m10-p-checksum",
  title: "Internet Checksum",
  difficulty: "medium",
  topicTags: ["networking", "bits", "c"],
  moduleId: "m10-networking",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement inet_checksum in ichecksum.c (no main).",
  constraints: "16-bit one's-complement sum, big-endian words, fold carries, return the complement. Handle odd length.",
  examples: [
    { title: "Two bytes", body: "{0x12,0x34} -> 0xEDCB" },
    { title: "Carry", body: "{0xFF,0xFF,0xFF,0xFF} -> 0x0000" },
  ],
  starterFiles: {
    c: [
      { path: "ichecksum.h", content: HEADER, editable: false },
      { path: "ichecksum.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "two_bytes", visibility: "sample" },
    { name: "empty", visibility: "hidden" },
    { name: "four_bytes", visibility: "hidden" },
    { name: "odd_length", visibility: "hidden" },
    { name: "carry_fold", visibility: "hidden" },
  ],
  followUps: ["Why is the checksum its own verifier (summing data + checksum yields all-ones)?"],
  triviaTags: ["endianness"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
