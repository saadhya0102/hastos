import { defineProblem, type ProblemDef } from "@hasystor/content-schema";

const HEADER = `#ifndef THREADPOOL_H
#define THREADPOOL_H
#include <pthread.h>

typedef struct { void (*fn)(void *); void *arg; } tp_task_t;

typedef struct {
  pthread_t threads[64];
  int num_workers;
  tp_task_t *tasks;     /* ring buffer, allocated in tp_init */
  int cap, head, tail, count;
  pthread_mutex_t m;
  pthread_cond_t has_work;
  pthread_cond_t has_space;
  int shutdown;
} pool_t;

/* Start num_workers worker threads. */
void tp_init(pool_t *p, int num_workers);
/* Enqueue a task (block if the internal queue is full). */
void tp_submit(pool_t *p, void (*fn)(void *), void *arg);
/* Stop accepting work, let all queued tasks finish, then join all workers. */
void tp_shutdown(pool_t *p);

#endif
`;

const STARTER = `#include "threadpool.h"
#include <stdlib.h>

static void *tp_worker(void *arg) {
  pool_t *p = (pool_t *)arg;
  for (;;) {
    pthread_mutex_lock(&p->m);
    while (p->count == 0 && !p->shutdown)
      pthread_cond_wait(&p->has_work, &p->m);
    if (p->count == 0 && p->shutdown) { pthread_mutex_unlock(&p->m); break; }
    tp_task_t t = p->tasks[p->head];
    p->head = (p->head + 1) % p->cap;
    p->count--;
    pthread_cond_signal(&p->has_space);
    pthread_mutex_unlock(&p->m);
    t.fn(t.arg);   /* run the task OUTSIDE the lock */
  }
  return NULL;
}

void tp_init(pool_t *p, int num_workers) {
  p->num_workers = num_workers;
  p->cap = 4096;
  p->tasks = (tp_task_t *)malloc(sizeof(tp_task_t) * p->cap);
  p->head = p->tail = p->count = 0;
  p->shutdown = 0;
  pthread_mutex_init(&p->m, NULL);
  pthread_cond_init(&p->has_work, NULL);
  pthread_cond_init(&p->has_space, NULL);
  for (int i = 0; i < num_workers; i++)
    pthread_create(&p->threads[i], NULL, tp_worker, p);
}

void tp_submit(pool_t *p, void (*fn)(void *), void *arg) {
  /* TODO: lock; while full wait on has_space; enqueue (fn,arg) at tail; count++;
     signal has_work; unlock. */
}

void tp_shutdown(pool_t *p) {
  /* TODO: lock; set shutdown=1; broadcast has_work; unlock; join all workers; free tasks. */
}
`;

const problem: ProblemDef = defineProblem({
  id: "m7-p-thread-pool",
  title: "Thread Pool",
  difficulty: "hard",
  topicTags: ["concurrency", "thread-pool", "c"],
  moduleId: "m7-concurrency",
  interview: true,
  allowedLanguages: ["c"],
  statementMdx: "./statement.mdx",
  signatureNote: "Implement tp_submit and tp_shutdown in threadpool.c (init + worker provided).",
  constraints: "Every submitted task runs exactly once; shutdown drains all tasks then joins cleanly (no hangs).",
  examples: [
    { title: "Run all", body: "submit M tasks; after shutdown, exactly M have run" },
  ],
  starterFiles: {
    c: [
      { path: "threadpool.h", content: HEADER, editable: false },
      { path: "threadpool.c", content: STARTER, editable: true },
    ],
  },
  gradingMode: "concurrency",
  limits: { cpuSec: 6, wallSec: 15, memoryKb: 262144 },
  harness: { driverFiles: ["driver.c"], sanitizers: ["asan_ubsan"], seeds: [1] },
  tests: [
    { name: "runs_all_small", visibility: "sample" },
    { name: "single_worker", visibility: "hidden" },
    { name: "many_tasks", visibility: "hidden" },
    { name: "args_summed", visibility: "hidden" },
    { name: "high_workers", visibility: "hidden" },
  ],
  followUps: [
    "Why run the task outside the lock?",
    "How does shutdown guarantee queued tasks still run before workers exit?",
  ],
  triviaTags: [],
  hintsPolicy: { defaultLevel: "nudge", allowFull: true },
});

export default problem;
