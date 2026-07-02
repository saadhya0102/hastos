import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef IPV4_H
#define IPV4_H
#include <stdint.h>

/* Parse a dotted-quad ("A.B.C.D") into *out with A in the high byte.
   Return 1 on success, 0 if the string is not a valid IPv4 address. */
int parse_ipv4(const char *s, uint32_t *out);

#endif
`;

const STARTER = `#include "ipv4.h"
#include <stdio.h>

int parse_ipv4(const char *s, uint32_t *out) {
  /* TODO: parse exactly four octets separated by dots, each in [0, 255].
     On success set *out = (a << 24) | (b << 16) | (c << 8) | d and return 1.
     On any problem (out of range, wrong count) return 0.
     You may assume the input contains only digits and dots; sscanf is allowed. */
  return 0;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m10-p-ipv4",
  title: "Parse an IPv4 Address",
  difficulty: "medium",
  topicTags: ["networking", "parsing", "c"],
  moduleId: "m10-networking",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement parse_ipv4 in ipv4.c (no main).",
  constraints:
    "Exactly four octets, each 0-255. First octet in the high byte. Return 1/0. Assume digits and dots only.",
  examples: [
    { title: "Valid", body: '"1.2.3.4" -> 1, *out = 0x01020304' },
    { title: "Invalid", body: '"256.0.0.1" -> 0 (octet > 255); "1.2.3" -> 0 (too few)' },
  ],
  starterFiles: {
    c: [
      { path: "ipv4.h", content: HEADER, editable: false },
      { path: "ipv4.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "basic", visibility: "sample" },
    { name: "zeros", visibility: "hidden" },
    { name: "max", visibility: "hidden" },
    { name: "mixed", visibility: "hidden" },
    { name: "overflow", visibility: "hidden" },
    { name: "too_few", visibility: "hidden" },
  ],
  followUps: [
    "Why is the address packed big-endian (network byte order), and where would htonl fit?",
    "How would you extend this to reject leading zeros or non-digit characters strictly?",
  ],
  triviaTags: ["networking"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
