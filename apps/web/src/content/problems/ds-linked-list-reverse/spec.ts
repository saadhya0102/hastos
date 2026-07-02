import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef LLREV_H
#define LLREV_H

typedef struct node { int val; struct node *next; } node_t;

/* Reverse a singly linked list in place; return the new head. */
node_t *reverse_list(node_t *head);

#endif
`;

const STARTER = `#include "llrev.h"

node_t *reverse_list(node_t *head) {
  /* TODO: iteratively rewire next pointers and return the new head.
     Keep prev = NULL; for each node, save next, point cur->next = prev,
     advance prev = cur, cur = next. Return prev at the end.
     Do NOT allocate new nodes (that would leak the originals). */
  return head;
}
`;

const problem: ProblemDef = defineProblem({
  id: "ds-linked-list-reverse",
  title: "Reverse a Linked List",
  difficulty: "medium",
  topicTags: ["data-structures", "pointers", "linked-list"],
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement reverse_list in llrev.c (no main).",
  constraints:
    "Reverse in place by rewiring pointers — do not allocate new nodes. Handle empty and single-node lists.",
  examples: [
    { title: "Basic", body: "1->2->3->4->5 becomes 5->4->3->2->1" },
    { title: "Edges", body: "empty stays empty; a single node is unchanged" },
  ],
  starterFiles: {
    c: [
      { path: "llrev.h", content: HEADER, editable: false },
      { path: "llrev.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "harness",
  limits: { cpuSec: 3, wallSec: 8, memoryKb: 131072 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "basic", visibility: "sample" },
    { name: "empty", visibility: "hidden" },
    { name: "single", visibility: "hidden" },
    { name: "two", visibility: "hidden" },
    { name: "ten", visibility: "hidden" },
  ],
  followUps: [
    "How would you reverse the list recursively, and what's the stack cost?",
    "How do you reverse only the first k nodes, or nodes between positions i and j?",
  ],
  triviaTags: ["data-structures"],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
