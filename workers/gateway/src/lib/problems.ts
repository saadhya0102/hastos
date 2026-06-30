import { zipSync, strToU8 } from "fflate";

/**
 * Hidden problem harnesses. Driver/header source lives ONLY here in the Worker — never in
 * the client bundle — so hidden test logic is not exposed. See PRD §11 / §37.
 *
 * Grading strategy for C "harness" problems: the learner's editable file is placed in the
 * sandbox as `impl.c`; the hidden `driver.c` (the Judge0 `source_code`) includes the shared
 * header and, at the bottom, `#include "impl.c"`, so a single-file compile links both.
 * AddressSanitizer + UBSan are enabled to catch memory errors.
 */

export interface HarnessProblem {
  id: string;
  languageId: number; // Judge0 C
  header: { name: string; content: string };
  driver: string; // becomes Judge0 source_code
  implName: string; // name the learner's file takes in the sandbox
  learnerFileName: string; // the editable file in the client spec
  compilerOptions: string;
  cpuTimeLimit: number;
  wallTimeLimit: number;
  memoryLimitKb: number;
  testVisibility: Record<string, "sample" | "hidden">;
}

const RINGBUF_HEADER = `#ifndef RINGBUF_H
#define RINGBUF_H
#include <stddef.h>
typedef struct { int *buf; size_t cap; size_t head; size_t tail; size_t count; } ringbuf_t;
void rb_init(ringbuf_t *rb, int *storage, size_t cap);
int rb_push(ringbuf_t *rb, int value);
int rb_pop(ringbuf_t *rb, int *out);
size_t rb_count(const ringbuf_t *rb);
#endif
`;

const RINGBUF_DRIVER = `#include "ringbuf.h"
#include <stdio.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
  { int s[4]; ringbuf_t rb; rb_init(&rb, s, 4);
    int ok = rb_push(&rb,1)&&rb_push(&rb,2)&&rb_push(&rb,3);
    int a=0,b=0,c=0; ok &= rb_pop(&rb,&a)&&rb_pop(&rb,&b)&&rb_pop(&rb,&c);
    CHECK("fifo_basic", ok && a==1 && b==2 && c==3, "expected 1,2,3 in order"); }

  { int s[2]; ringbuf_t rb; rb_init(&rb, s, 2);
    int ok = rb_push(&rb,10)&&rb_push(&rb,20);
    int rejected = (rb_push(&rb,30)==0);
    int x=0; rb_pop(&rb,&x);
    CHECK("full_rejects", ok && rejected && x==10, "push when full must return 0 and not overwrite"); }

  { int s[2]; ringbuf_t rb; rb_init(&rb, s, 2); int x=0;
    CHECK("empty_pop", rb_pop(&rb,&x)==0 && rb_count(&rb)==0, "pop on empty must return 0"); }

  { int s[4]; ringbuf_t rb; rb_init(&rb, s, 4);
    rb_push(&rb,1); rb_push(&rb,2); int t=0;
    rb_pop(&rb,&t); rb_pop(&rb,&t);
    rb_push(&rb,3); rb_push(&rb,4); rb_push(&rb,5); rb_push(&rb,6);
    int ok=1,v=0,exp=3; for(int i=0;i<4;i++){ ok &= rb_pop(&rb,&v) && v==exp++; }
    CHECK("wraparound", ok, "indices must wrap correctly around capacity"); }

  { int s[8]; ringbuf_t rb; rb_init(&rb, s, 8);
    int model[8]; size_t mh=0, mc=0; unsigned seed=12345; int ok=1;
    for (int i=0;i<100000 && ok;i++) {
      seed = seed*1103515245u + 12345u;
      if ((seed>>16)&1) { int v=(int)(seed&0xffff);
        int r=rb_push(&rb,v);
        if (mc<8){ model[(mh+mc)&7]=v; mc++; if(!r) ok=0; }
        else { if(r) ok=0; }
      } else { int v=0;
        int r=rb_pop(&rb,&v);
        if (mc>0){ int e=model[mh&7]; mh++; mc--; if(!r||v!=e) ok=0; }
        else { if(r) ok=0; }
      }
      if (rb_count(&rb)!=mc) ok=0;
    }
    CHECK("stress_random", ok, "behavior diverged from reference model"); }

  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass==g_total ? 0 : 1;
}

#include "impl.c"
`;

const PROBLEMS: Record<string, HarnessProblem> = {
  "ds-ring-buffer": {
    id: "ds-ring-buffer",
    languageId: 50, // C (GCC) — verify against the live Judge0 instance
    header: { name: "ringbuf.h", content: RINGBUF_HEADER },
    driver: RINGBUF_DRIVER,
    implName: "impl.c",
    learnerFileName: "ringbuf.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 5,
    wallTimeLimit: 12,
    memoryLimitKb: 262144,
    testVisibility: {
      fifo_basic: "sample",
      full_rejects: "hidden",
      empty_pop: "hidden",
      wraparound: "hidden",
      stress_random: "hidden",
    },
  },
};

export function getHarnessProblem(id: string): HarnessProblem | undefined {
  return PROBLEMS[id];
}

export interface AssembledHarness {
  languageId: number;
  sourceCode: string;
  additionalFilesZipB64: string;
  compilerOptions: string;
  cpuTimeLimit: number;
  wallTimeLimit: number;
  memoryLimitKb: number;
}

/** Build the Judge0 multi-file payload from the learner's editable source. */
export function assembleHarness(
  problem: HarnessProblem,
  learnerSource: string,
): AssembledHarness {
  const zipped = zipSync({
    [problem.header.name]: strToU8(problem.header.content),
    [problem.implName]: strToU8(learnerSource),
  });
  let bin = "";
  for (const b of zipped) bin += String.fromCharCode(b);
  return {
    languageId: problem.languageId,
    sourceCode: problem.driver,
    additionalFilesZipB64: btoa(bin),
    compilerOptions: problem.compilerOptions,
    cpuTimeLimit: problem.cpuTimeLimit,
    wallTimeLimit: problem.wallTimeLimit,
    memoryLimitKb: problem.memoryLimitKb,
  };
}
