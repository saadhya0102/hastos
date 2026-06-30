import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef HTTPPARSE_H
#define HTTPPARSE_H
/*
 * Parse an HTTP/1.x request. Lines end with CRLF ("\\r\\n").
 * The request line is: METHOD SP TARGET SP VERSION  where VERSION starts with "HTTP/".
 * Headers ("Name: Value") follow until a blank line.
 *
 * On success: copy the method into method_out, the target into path_out, and return the
 * number of header lines (>= 0). On a malformed request line, return -1.
 * Buffers are large enough (method_out >= 16, path_out >= 256).
 */
int http_parse(const char *req, char *method_out, char *path_out);
#endif
`;

const STARTER = `#include "httpparse.h"
#include <string.h>

int http_parse(const char *req, char *method_out, char *path_out) {
  /* TODO:
     - Find the end of the first line (the "\\r\\n").
     - Split the request line on single spaces into method, target, version.
       Require all three; require version to start with "HTTP/". Else return -1.
     - Copy method -> method_out, target -> path_out.
     - Count header lines after the request line until a blank line; return that count. */
  return -1;
}
`;

const problem: ProblemDef = defineProblem({
  id: "m10-p-http-parse",
  title: "HTTP Request Parser",
  difficulty: "medium",
  topicTags: ["networking", "http", "parsing", "c"],
  moduleId: "m10-networking",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement http_parse in httpparse.c (no main).",
  constraints: "CRLF line endings. Validate the request line (3 tokens, version starts with HTTP/). Return header count or -1.",
  examples: [
    { title: "GET", body: '"GET / HTTP/1.1\\r\\nHost: x\\r\\n\\r\\n" -> method GET, path /, 1 header' },
  ],
  starterFiles: {
    c: [
      { path: "httpparse.h", content: HEADER, editable: false },
      { path: "httpparse.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 2, wallSec: 5, memoryKb: 65536 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "simple", visibility: "sample" },
    { name: "two_headers", visibility: "hidden" },
    { name: "post_no_headers", visibility: "hidden" },
    { name: "malformed_short", visibility: "hidden" },
    { name: "malformed_version", visibility: "hidden" },
  ],
  followUps: [
    "How would you find where the body starts and its length (Content-Length / chunked)?",
    "What input would cause an out-of-bounds read if you weren't careful?",
  ],
  triviaTags: ["head-of-line"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
