import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef RWLOCK_H
#define RWLOCK_H
#include <pthread.h>
typedef struct { pthread_mutex_t m; pthread_cond_t c; int readers; int writing; } rwlock_t;
void rw_init(rwlock_t *l);
void rw_rlock(rwlock_t *l);   /* shared read lock */
void rw_runlock(rwlock_t *l);
void rw_wlock(rwlock_t *l);   /* exclusive write lock */
void rw_wunlock(rwlock_t *l);
#endif
`;
const STARTER = `#include "rwlock.h"

void rw_init(rwlock_t *l) {
  pthread_mutex_init(&l->m, 0); pthread_cond_init(&l->c, 0); l->readers = 0; l->writing = 0;
}

void rw_rlock(rwlock_t *l) {
  /* TODO: lock m; while a writer is active, wait; readers++; unlock. */
}
void rw_runlock(rwlock_t *l) {
  /* TODO: lock m; readers--; if readers == 0 broadcast; unlock. */
}
void rw_wlock(rwlock_t *l) {
  /* TODO: lock m; while writing or readers > 0, wait; writing = 1; unlock. */
}
void rw_wunlock(rwlock_t *l) {
  /* TODO: lock m; writing = 0; broadcast; unlock. */
}
`;
const problem: ProblemDef = defineProblem({
  id: "m7-p-rwlock", title: "Readers-Writer Lock", difficulty: "medium",
  topicTags: ["concurrency", "locks", "c"], moduleId: "m7-concurrency", interview: true,
  allowedLanguages: ["c"], statementMdx: "./statement.mdx",
  signatureNote: "Implement the four lock/unlock functions in rwlock.c (init provided).",
  constraints: "Multiple readers OR one writer. Writers must be exclusive; the count under wlock must be exact.",
  examples: [{ title: "Exclusion", body: "writers increment a shared counter under wlock; the total is exact" }],
  starterFiles: { c: [{ path: "rwlock.h", content: HEADER, editable: false }, { path: "rwlock.c", content: STARTER, editable: true }] },
  gradingMode: "concurrency", limits: { cpuSec: 6, wallSec: 15, memoryKb: 262144 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "one_writer", visibility: "sample" },
    { name: "writers", visibility: "hidden" },
    { name: "readers_and_writers", visibility: "hidden" },
    { name: "high_contention", visibility: "hidden" },
    { name: "reacquire", visibility: "hidden" },
  ],
  followUps: ["Does this favor readers or writers, and how would you prevent writer starvation?"],
  triviaTags: [], hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});
export default problem;
