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

const STRLEN_HEADER = `#ifndef MYSTRLEN_H
#define MYSTRLEN_H
#include <stddef.h>
size_t my_strlen(const char *s);
#endif
`;

const STRLEN_DRIVER = `#include "mystrlen.h"
#include <stdio.h>
#include <string.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
  CHECK("empty", my_strlen("") == 0, "empty string should have length 0");
  CHECK("single_char", my_strlen("x") == 1, "single character should have length 1");
  CHECK("hello", my_strlen("hello") == 5, "hello should have length 5");
  CHECK("with_spaces", my_strlen("a b c") == 5, "a b c should have length 5");

  { char buf[1000]; memset(buf, 'a', 999); buf[999] = '\\0';
    CHECK("long_string", my_strlen(buf) == 999, "999-char string should have length 999"); }

  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const MEMCPY_HEADER = `#ifndef MYMEMCPY_H
#define MYMEMCPY_H
#include <stddef.h>
void *my_memcpy(void *dst, const void *src, size_t n);
#endif
`;

const MEMCPY_DRIVER = `#include "mymemcpy.h"
#include <stdio.h>
#include <string.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
  { char dst[6] = {0}; my_memcpy(dst, "hello", 5); dst[5] = '\\0';
    CHECK("basic_copy", memcmp(dst, "hello", 5) == 0, "should copy 5 bytes hello"); }

  { char dst[4] = "abc"; void *r = my_memcpy(dst, "XYZ", 0);
    CHECK("zero_bytes", dst[0] == 'a' && r == dst, "n=0 must copy nothing and return dst"); }

  { char dst[4] = {0}; void *r = my_memcpy(dst, "hi", 2);
    CHECK("returns_dst", r == dst, "must return the destination pointer"); }

  { unsigned char src[5] = {0, 1, 0, 255, 7}; unsigned char dst[5] = {9, 9, 9, 9, 9};
    my_memcpy(dst, src, 5);
    CHECK("binary_data", memcmp(dst, src, 5) == 0, "must copy raw bytes including embedded zeros"); }

  { static unsigned char src[4096], dst[4096];
    for (int i = 0; i < 4096; i++) src[i] = (unsigned char)(i * 31 + 7);
    my_memcpy(dst, src, 4096);
    CHECK("large_copy", memcmp(dst, src, 4096) == 0, "must copy all 4096 bytes correctly"); }

  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const POPCOUNT_HEADER = `#ifndef POPCOUNT_H
#define POPCOUNT_H
int popcount(unsigned x);
#endif
`;

const POPCOUNT_DRIVER = `#include "popcount.h"
#include <stdio.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
  CHECK("zero", popcount(0u) == 0, "popcount(0) should be 0");
  CHECK("one_bit", popcount(0x00010000u) == 1, "a single set bit should count as 1");
  CHECK("byte_all_ones", popcount(0xFFu) == 8, "0xFF has 8 set bits");
  CHECK("mixed", popcount(0xB4u) == 4, "0xB4 has 4 set bits");
  CHECK("all_32_bits", popcount(0xFFFFFFFFu) == 32, "all ones has 32 set bits");
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const SATADD_HEADER = `#ifndef SATADD_H
#define SATADD_H
#include <stdint.h>
uint8_t sat_add_u8(uint8_t a, uint8_t b);
#endif
`;

const SATADD_DRIVER = `#include "satadd.h"
#include <stdio.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
  CHECK("no_overflow", sat_add_u8(100, 50) == 150, "100 + 50 should be 150");
  CHECK("both_zero", sat_add_u8(0, 0) == 0, "0 + 0 should be 0");
  CHECK("exact_max", sat_add_u8(200, 55) == 255, "200 + 55 should be exactly 255");
  CHECK("overflow_clamps", sat_add_u8(200, 100) == 255, "200 + 100 should clamp to 255, not wrap to 44");
  CHECK("max_plus_max", sat_add_u8(255, 255) == 255, "255 + 255 should clamp to 255");
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const BSWAP_HEADER = `#ifndef BSWAP32_H
#define BSWAP32_H
#include <stdint.h>
uint32_t bswap32(uint32_t x);
#endif
`;

const BSWAP_DRIVER = `#include "bswap32.h"
#include <stdio.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
  CHECK("example", bswap32(0x12345678u) == 0x78563412u, "0x12345678 should reverse to 0x78563412");
  CHECK("zero", bswap32(0u) == 0u, "0 reverses to 0");
  CHECK("all_ones", bswap32(0xFFFFFFFFu) == 0xFFFFFFFFu, "all ones reverses to all ones");
  CHECK("low_byte_only", bswap32(0x000000ABu) == 0xAB000000u, "low byte should move to the high byte");
  CHECK("involution", bswap32(bswap32(0xDEADBEEFu)) == 0xDEADBEEFu, "swapping twice should return the original");
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const FLOATBITS_HEADER = `#ifndef FLOATBITS_H
#define FLOATBITS_H
#include <stdint.h>
uint32_t float_bits(float f);
#endif
`;

const FLOATBITS_DRIVER = `#include "floatbits.h"
#include <stdio.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
  CHECK("one", float_bits(1.0f) == 0x3F800000u, "1.0f bit pattern should be 0x3F800000");
  CHECK("zero", float_bits(0.0f) == 0x00000000u, "0.0f bit pattern should be 0x00000000");
  CHECK("two", float_bits(2.0f) == 0x40000000u, "2.0f bit pattern should be 0x40000000");
  CHECK("negative_one", float_bits(-1.0f) == 0xBF800000u, "-1.0f bit pattern should be 0xBF800000");
  CHECK("one_half", float_bits(0.5f) == 0x3F000000u, "0.5f bit pattern should be 0x3F000000");
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const BABS_HEADER = `#ifndef BRANCHLESS_ABS_H
#define BRANCHLESS_ABS_H
int my_abs(int x);
#endif
`;

const BABS_DRIVER = `#include "babs.h"
#include <stdio.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
  CHECK("positive", my_abs(5) == 5, "abs(5) should be 5");
  CHECK("negative", my_abs(-5) == 5, "abs(-5) should be 5");
  CHECK("zero", my_abs(0) == 0, "abs(0) should be 0");
  CHECK("large_positive", my_abs(123456) == 123456, "abs(123456) should be 123456");
  CHECK("large_negative", my_abs(-123456) == 123456, "abs(-123456) should be 123456");
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const SELECT_HEADER = `#ifndef SELECT_H
#define SELECT_H
int select_int(int cond, int a, int b);
#endif
`;

const SELECT_DRIVER = `#include "select.h"
#include <stdio.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
  CHECK("true_one", select_int(1, 10, 20) == 10, "cond=1 should select a (10)");
  CHECK("false_zero", select_int(0, 10, 20) == 20, "cond=0 should select b (20)");
  CHECK("truthy_nonone", select_int(7, 1, 2) == 1, "any non-zero cond should select a");
  CHECK("negative_cond", select_int(-3, 1, 2) == 1, "negative (non-zero) cond should select a");
  CHECK("equal_values", select_int(0, 5, 5) == 5, "equal values, cond=0 should select b (5)");
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const CACHESIM_HEADER = `#ifndef CACHESIM_H
#define CACHESIM_H
void cache_sim(int num_sets, int block_bytes, const unsigned long *addrs,
               int n, int *hits, int *misses);
#endif
`;

const CACHESIM_DRIVER = `#include "cachesim.h"
#include <stdio.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
  { unsigned long a[] = {0}; int h = 9, m = 9; cache_sim(4, 16, a, 1, &h, &m);
    CHECK("single_miss", h == 0 && m == 1, "one cold access should be 0 hits, 1 miss"); }
  { unsigned long a[] = {0, 4, 8}; int h = 9, m = 9; cache_sim(4, 16, a, 3, &h, &m);
    CHECK("repeat_hit", h == 2 && m == 1, "same line reused should give 2 hits, 1 miss"); }
  { unsigned long a[] = {0, 16, 0, 16}; int h = 9, m = 9; cache_sim(1, 16, a, 4, &h, &m);
    CHECK("conflict_evict", h == 0 && m == 4, "single set alternating lines should give 4 misses"); }
  { unsigned long a[] = {0, 16, 32, 0, 64, 0, 16}; int h = 9, m = 9; cache_sim(4, 16, a, 7, &h, &m);
    CHECK("mixed_trace", h == 2 && m == 5, "expected 2 hits and 5 misses"); }
  { unsigned long a[1] = {0}; int h = 9, m = 9; cache_sim(4, 16, a, 0, &h, &m);
    CHECK("empty", h == 0 && m == 0, "n=0 should give 0 hits, 0 misses"); }
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const TRANSPOSE_HEADER = `#ifndef TRANSPOSE_H
#define TRANSPOSE_H
void transpose(int n, const int *src, int *dst);
#endif
`;

const TRANSPOSE_DRIVER = `#include "transpose.h"
#include <stdio.h>
#include <stdlib.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

static int check_t(int n) {
  int *src = (int *)malloc((size_t)n * n * sizeof(int));
  int *dst = (int *)malloc((size_t)n * n * sizeof(int));
  for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++)
      src[i * n + j] = i * 100 + j;
  transpose(n, src, dst);
  int ok = 1;
  for (int i = 0; i < n && ok; i++)
    for (int j = 0; j < n && ok; j++)
      if (dst[i * n + j] != j * 100 + i) ok = 0;
  free(src); free(dst);
  return ok;
}

int main(void) {
  CHECK("one_by_one", check_t(1), "1x1 transpose failed");
  CHECK("two_by_two", check_t(2), "2x2 transpose failed");
  CHECK("three_by_three", check_t(3), "3x3 transpose failed");
  CHECK("four_by_four", check_t(4), "4x4 transpose failed");
  CHECK("large_64", check_t(64), "64x64 transpose failed");
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const SYMRESOLVE_HEADER = `#ifndef SYMRESOLVE_H
#define SYMRESOLVE_H
int resolve_symbol(int strong_defs, int weak_defs);
#endif
`;

const SYMRESOLVE_DRIVER = `#include "symresolve.h"
#include <stdio.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
  CHECK("one_strong", resolve_symbol(1, 0) == 0, "one strong def should resolve (0)");
  CHECK("one_weak", resolve_symbol(0, 1) == 0, "one weak def should resolve (0)");
  CHECK("strong_wins", resolve_symbol(1, 2) == 0, "one strong with weaks should resolve (0)");
  CHECK("multiple_strong", resolve_symbol(2, 0) == -1, "two strong defs should be -1");
  CHECK("undefined", resolve_symbol(0, 0) == -2, "no definition should be -2");
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const FORKCOUNT_HEADER = `#ifndef FORKCOUNT_H
#define FORKCOUNT_H
long processes_after_forks(int n);
#endif
`;

const FORKCOUNT_DRIVER = `#include "forkcount.h"
#include <stdio.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
  CHECK("zero", processes_after_forks(0) == 1L, "0 forks should be 1 process");
  CHECK("one", processes_after_forks(1) == 2L, "1 fork should be 2 processes");
  CHECK("three", processes_after_forks(3) == 8L, "3 forks should be 8 processes");
  CHECK("ten", processes_after_forks(10) == 1024L, "10 forks should be 1024 processes");
  CHECK("thirtyone", processes_after_forks(31) == 2147483648L, "31 forks should be 2^31 processes");
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const ARENA_HEADER = `#ifndef ARENA_H
#define ARENA_H
#include <stddef.h>
typedef struct { char *base; size_t size; size_t used; } arena_t;
void arena_init(arena_t *a, void *buf, size_t size);
void *arena_alloc(arena_t *a, size_t n);
void arena_reset(arena_t *a);
#endif
`;

const ARENA_DRIVER = `#include "arena.h"
#include <stdio.h>
#include <stdint.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
  _Alignas(16) static unsigned char buf[64];
  arena_t a;

  arena_init(&a, buf, 64);
  { void *p = arena_alloc(&a, 8);
    int ok = p && (unsigned char *)p >= buf && (unsigned char *)p + 8 <= buf + 64;
    CHECK("basic_alloc", ok, "alloc 8 should return an in-range pointer"); }

  arena_init(&a, buf, 64);
  { void *p1 = arena_alloc(&a, 1); void *p2 = arena_alloc(&a, 8);
    int ok = p1 && p2 && ((uintptr_t)p2 % 8 == 0) && ((unsigned char *)p2 >= (unsigned char *)p1 + 1);
    CHECK("alignment", ok, "second alloc should be 8-aligned and not overlap the first"); }

  arena_init(&a, buf, 64);
  { void *p = arena_alloc(&a, 100);
    CHECK("out_of_room", p == NULL, "an alloc larger than the buffer should return NULL"); }

  arena_init(&a, buf, 64);
  { int ok = 1; for (int i = 0; i < 8; i++) if (!arena_alloc(&a, 8)) ok = 0;
    if (arena_alloc(&a, 8) != NULL) ok = 0;
    CHECK("exhaust", ok, "eight 8-byte allocs fill 64 bytes; the ninth should be NULL"); }

  arena_init(&a, buf, 64);
  { for (int i = 0; i < 8; i++) arena_alloc(&a, 8); arena_reset(&a);
    void *p = arena_alloc(&a, 8);
    CHECK("reset_reuse", p == (void *)buf, "after reset, alloc should return the base again"); }

  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const POOL_HEADER = `#ifndef POOL_H
#define POOL_H
#include <stddef.h>
typedef struct { void *free_list; size_t block_size; } pool_t;
void pool_init(pool_t *p, void *buf, size_t buf_size, size_t block_size);
void *pool_alloc(pool_t *p);
void pool_free(pool_t *p, void *blk);
#endif
`;

const POOL_DRIVER = `#include "pool.h"
#include <stdio.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
  _Alignas(16) static unsigned char buf[64];
  pool_t p;

  pool_init(&p, buf, 64, 16);
  { void *b = pool_alloc(&p);
    int ok = b && (unsigned char *)b >= buf && (unsigned char *)b + 16 <= buf + 64;
    CHECK("alloc_one", ok, "alloc should return an in-range block"); }

  pool_init(&p, buf, 64, 16);
  { void *x = pool_alloc(&p); void *y = pool_alloc(&p);
    CHECK("distinct_blocks", x && y && x != y, "two allocations should return distinct blocks"); }

  pool_init(&p, buf, 64, 16);
  { int ok = 1; for (int i = 0; i < 4; i++) if (!pool_alloc(&p)) ok = 0;
    if (pool_alloc(&p) != NULL) ok = 0;
    CHECK("exhaust", ok, "four 16-byte blocks then NULL"); }

  pool_init(&p, buf, 64, 16);
  { void *b[4]; for (int i = 0; i < 4; i++) b[i] = pool_alloc(&p);
    pool_free(&p, b[1]); void *x = pool_alloc(&p);
    CHECK("free_reuse", x == b[1], "the freed block should be returned by the next alloc"); }

  pool_init(&p, buf, 64, 16);
  { void *b[4]; for (int i = 0; i < 4; i++) b[i] = pool_alloc(&p);
    for (int i = 0; i < 4; i++) pool_free(&p, b[i]);
    int ok = 1; for (int i = 0; i < 4; i++) if (!pool_alloc(&p)) ok = 0;
    CHECK("refill", ok, "after freeing all blocks, all can be allocated again"); }

  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const SPINLOCK_HEADER = `#ifndef SPINLOCK_H
#define SPINLOCK_H
#include <stdatomic.h>
typedef struct { atomic_int locked; } spinlock_t;
void spin_init(spinlock_t *s);
void spin_lock(spinlock_t *s);
void spin_unlock(spinlock_t *s);
#endif
`;

const SPINLOCK_DRIVER = `#include "spinlock.h"
#include <stdio.h>
#include <pthread.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

static spinlock_t g_lock;
static long g_counter;
static int g_iters;
static void *sl_worker(void *u) { (void)u;
  for (int i = 0; i < g_iters; i++) { spin_lock(&g_lock); g_counter++; spin_unlock(&g_lock); }
  return NULL;
}
static long sl_run(int n, int iters) {
  spin_init(&g_lock); g_counter = 0; g_iters = iters;
  pthread_t t[16];
  for (int i = 0; i < n; i++) pthread_create(&t[i], NULL, sl_worker, NULL);
  for (int i = 0; i < n; i++) pthread_join(t[i], NULL);
  return g_counter;
}
int main(void) {
  CHECK("single", sl_run(1, 1000) == 1000, "1 thread x1000 should total 1000");
  CHECK("two_threads", sl_run(2, 50000) == 100000, "2x50000 should total 100000");
  CHECK("four_threads", sl_run(4, 50000) == 200000, "4x50000 should total 200000");
  CHECK("reacquire", sl_run(1, 3) == 3, "repeated lock/unlock should work");
  CHECK("high_contention", sl_run(8, 20000) == 160000, "8x20000 should total 160000");
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const BQUEUE_HEADER = `#ifndef BQUEUE_H
#define BQUEUE_H
#include <pthread.h>
typedef struct {
  int *buf; int cap, head, tail, count;
  pthread_mutex_t m; pthread_cond_t not_full; pthread_cond_t not_empty;
} bqueue_t;
void bq_init(bqueue_t *q, int *storage, int cap);
void bq_push(bqueue_t *q, int value);
int bq_pop(bqueue_t *q);
#endif
`;

const BQUEUE_DRIVER = `#include "bqueue.h"
#include <stdio.h>
#include <pthread.h>
#include <stdatomic.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

static atomic_long g_sum;
typedef struct { bqueue_t *q; int from, to; } prod_arg;
typedef struct { bqueue_t *q; int n; } cons_arg;
static void *bq_producer(void *a) { prod_arg *p = a;
  for (int v = p->from; v < p->to; v++) bq_push(p->q, v); return NULL; }
static void *bq_consumer(void *a) { cons_arg *c = a;
  for (int i = 0; i < c->n; i++) atomic_fetch_add(&g_sum, (long)bq_pop(c->q)); return NULL; }

static long bq_run(int cap, int producers, int consumers, int total) {
  static int store[1024];
  bqueue_t q; bq_init(&q, store, cap);
  atomic_store(&g_sum, 0);
  pthread_t pt[16], ct[16]; prod_arg pa[16]; cons_arg ca[16];
  int per_p = total / producers, per_c = total / consumers;
  for (int i = 0; i < producers; i++) { pa[i].q = &q; pa[i].from = i * per_p; pa[i].to = (i + 1) * per_p;
    pthread_create(&pt[i], NULL, bq_producer, &pa[i]); }
  for (int i = 0; i < consumers; i++) { ca[i].q = &q; ca[i].n = per_c;
    pthread_create(&ct[i], NULL, bq_consumer, &ca[i]); }
  for (int i = 0; i < producers; i++) pthread_join(pt[i], NULL);
  for (int i = 0; i < consumers; i++) pthread_join(ct[i], NULL);
  return atomic_load(&g_sum);
}

int main(void) {
  { int store[8]; bqueue_t q; bq_init(&q, store, 8);
    bq_push(&q, 1); bq_push(&q, 2); bq_push(&q, 3);
    int ok = bq_pop(&q) == 1 && bq_pop(&q) == 2 && bq_pop(&q) == 3;
    CHECK("single_thread_fifo", ok, "FIFO order should be 1,2,3"); }
  CHECK("spsc", bq_run(8, 1, 1, 1000) == 499500L, "SPSC sum of 0..999 should be 499500");
  CHECK("mpsc", bq_run(8, 4, 1, 1000) == 499500L, "MPSC sum should be 499500 (no lost/dup)");
  CHECK("small_capacity", bq_run(1, 2, 2, 1000) == 499500L, "cap=1 forces blocking; sum 499500");
  CHECK("mpmc", bq_run(16, 2, 2, 1000) == 499500L, "MPMC sum should be 499500");
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const THREADPOOL_HEADER = `#ifndef THREADPOOL_H
#define THREADPOOL_H
#include <pthread.h>
typedef struct { void (*fn)(void *); void *arg; } tp_task_t;
typedef struct {
  pthread_t threads[64]; int num_workers;
  tp_task_t *tasks; int cap, head, tail, count;
  pthread_mutex_t m; pthread_cond_t has_work; pthread_cond_t has_space;
  int shutdown;
} pool_t;
void tp_init(pool_t *p, int num_workers);
void tp_submit(pool_t *p, void (*fn)(void *), void *arg);
void tp_shutdown(pool_t *p);
#endif
`;

const THREADPOOL_DRIVER = `#include "threadpool.h"
#include <stdio.h>
#include <stdint.h>
#include <stdatomic.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

static atomic_int g_count;
static atomic_long g_argsum;
static void task_inc(void *a) { (void)a; atomic_fetch_add(&g_count, 1); }
static void task_arg(void *a) { atomic_fetch_add(&g_argsum, (long)(intptr_t)a); }

static int run_pool(int workers, int m) {
  pool_t p; tp_init(&p, workers); atomic_store(&g_count, 0);
  for (int i = 0; i < m; i++) tp_submit(&p, task_inc, NULL);
  tp_shutdown(&p);
  return atomic_load(&g_count);
}

int main(void) {
  CHECK("runs_all_small", run_pool(2, 10) == 10, "all 10 tasks should run");
  CHECK("single_worker", run_pool(1, 500) == 500, "500 tasks with 1 worker");
  CHECK("many_tasks", run_pool(4, 2000) == 2000, "2000 tasks with 4 workers");
  { pool_t p; tp_init(&p, 4); atomic_store(&g_argsum, 0);
    for (int i = 1; i <= 100; i++) tp_submit(&p, task_arg, (void *)(intptr_t)i);
    tp_shutdown(&p);
    CHECK("args_summed", atomic_load(&g_argsum) == 5050L, "sum of args 1..100 should be 5050"); }
  CHECK("high_workers", run_pool(8, 2000) == 2000, "2000 tasks with 8 workers");
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const MPSC_HEADER = `#ifndef MPSC_H
#define MPSC_H
#include <stdatomic.h>
typedef struct mpsc_node { _Atomic(struct mpsc_node *) next; long value; } mpsc_node_t;
typedef struct { _Atomic(mpsc_node_t *) head; mpsc_node_t *tail; mpsc_node_t stub; } mpsc_t;
void mpsc_init(mpsc_t *q);
void mpsc_enqueue(mpsc_t *q, mpsc_node_t *n);
mpsc_node_t *mpsc_dequeue(mpsc_t *q);
#endif
`;

const MPSC_DRIVER = `#include "mpsc.h"
#include <stdio.h>
#include <pthread.h>
#include <stdlib.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

typedef struct { mpsc_t *q; int from, to; } mp_arg;
static void *mp_producer(void *a) { mp_arg *p = a;
  for (int v = p->from; v < p->to; v++) {
    mpsc_node_t *n = malloc(sizeof(mpsc_node_t));
    n->value = v; mpsc_enqueue(p->q, n);
  }
  return NULL;
}

static int run_mpsc(int producers, int per, int check_fifo) {
  mpsc_t q; mpsc_init(&q);
  int total = producers * per;
  char *seen = calloc((size_t)total, 1);
  int *last = NULL;
  if (check_fifo) { last = malloc(sizeof(int) * producers); for (int i = 0; i < producers; i++) last[i] = -1; }
  pthread_t pt[16]; mp_arg pa[16];
  for (int i = 0; i < producers; i++) { pa[i].q = &q; pa[i].from = i * per; pa[i].to = (i + 1) * per;
    pthread_create(&pt[i], NULL, mp_producer, &pa[i]); }
  int got = 0, ok = 1;
  while (got < total) {
    mpsc_node_t *n = mpsc_dequeue(&q);
    if (!n) continue;
    long v = n->value;
    if (v < 0 || v >= total || seen[v]) ok = 0;
    else { seen[v] = 1; got++;
      if (check_fifo) { int p = (int)(v / per), i = (int)(v % per); if (i <= last[p]) ok = 0; last[p] = i; }
    }
    /* nodes are intentionally not freed (avoids freeing the embedded stub; TSan has no leak check) */
  }
  for (int i = 0; i < producers; i++) pthread_join(pt[i], NULL);
  for (int i = 0; i < total; i++) if (!seen[i]) ok = 0;
  free(seen); if (last) free(last);
  return ok;
}

int main(void) {
  CHECK("spsc_small", run_mpsc(1, 100, 0), "1 producer x100 should be received once each");
  CHECK("mpsc_two", run_mpsc(2, 1000, 0), "2 producers x1000 received once each");
  CHECK("mpsc_four", run_mpsc(4, 2000, 0), "4 producers x2000 received once each");
  CHECK("per_producer_fifo", run_mpsc(4, 1000, 1), "per-producer FIFO order preserved");
  CHECK("stress", run_mpsc(8, 5000, 0), "8 producers x5000 received once each");
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const ACOUNTER_HEADER = `#ifndef ACOUNTER_H
#define ACOUNTER_H
#include <stdatomic.h>
typedef struct { atomic_long v; } counter_t;
void counter_init(counter_t *c);
void counter_inc(counter_t *c);
long counter_get(counter_t *c);
#endif
`;

const ACOUNTER_DRIVER = `#include "acounter.h"
#include <stdio.h>
#include <pthread.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

static counter_t g_c;
static int g_iters;
static void *ac_worker(void *u) { (void)u; for (int i = 0; i < g_iters; i++) counter_inc(&g_c); return NULL; }
static long ac_run(int n, int iters) {
  counter_init(&g_c); g_iters = iters;
  pthread_t t[16];
  for (int i = 0; i < n; i++) pthread_create(&t[i], NULL, ac_worker, NULL);
  for (int i = 0; i < n; i++) pthread_join(t[i], NULL);
  return counter_get(&g_c);
}
int main(void) {
  CHECK("single", ac_run(1, 1000) == 1000, "1x1000 should total 1000");
  CHECK("two_threads", ac_run(2, 50000) == 100000, "2x50000 should total 100000");
  CHECK("four_threads", ac_run(4, 50000) == 200000, "4x50000 should total 200000");
  CHECK("eight_threads", ac_run(8, 20000) == 160000, "8x20000 should total 160000");
  { counter_init(&g_c); for (int i = 0; i < 5; i++) counter_inc(&g_c);
    CHECK("get_value", counter_get(&g_c) == 5, "get should return 5 after 5 increments"); }
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const TICKET_HEADER = `#ifndef TICKET_H
#define TICKET_H
#include <stdatomic.h>
typedef struct { atomic_uint next; atomic_uint serving; } ticket_t;
void ticket_init(ticket_t *t);
void ticket_lock(ticket_t *t);
void ticket_unlock(ticket_t *t);
#endif
`;

const TICKET_DRIVER = `#include "ticket.h"
#include <stdio.h>
#include <pthread.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

static ticket_t g_lock;
static long g_counter;
static int g_iters;
static void *tk_worker(void *u) { (void)u;
  for (int i = 0; i < g_iters; i++) { ticket_lock(&g_lock); g_counter++; ticket_unlock(&g_lock); }
  return NULL;
}
static long tk_run(int n, int iters) {
  ticket_init(&g_lock); g_counter = 0; g_iters = iters;
  pthread_t t[16];
  for (int i = 0; i < n; i++) pthread_create(&t[i], NULL, tk_worker, NULL);
  for (int i = 0; i < n; i++) pthread_join(t[i], NULL);
  return g_counter;
}
int main(void) {
  CHECK("single", tk_run(1, 1000) == 1000, "1x1000 should total 1000");
  CHECK("two_threads", tk_run(2, 50000) == 100000, "2x50000 should total 100000");
  CHECK("four_threads", tk_run(4, 50000) == 200000, "4x50000 should total 200000");
  CHECK("high_contention", tk_run(8, 20000) == 160000, "8x20000 should total 160000");
  CHECK("reacquire", tk_run(1, 3) == 3, "repeated lock/unlock should work");
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const TSTACK_HEADER = `#ifndef TSTACK_H
#define TSTACK_H
#include <stdatomic.h>
typedef struct ts_node { struct ts_node *next; long value; } ts_node_t;
typedef struct { _Atomic(ts_node_t *) head; } tstack_t;
void ts_init(tstack_t *s);
void ts_push(tstack_t *s, ts_node_t *n);
ts_node_t *ts_pop(tstack_t *s);
#endif
`;

const TSTACK_DRIVER = `#include "tstack.h"
#include <stdio.h>
#include <pthread.h>
#include <stdlib.h>
#include <stdatomic.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

static tstack_t g_s;
static atomic_long g_sum;
typedef struct { int from, to; } rng_t;
static void *st_pusher(void *a) { rng_t *r = a;
  for (int v = r->from; v < r->to; v++) { ts_node_t *n = malloc(sizeof(ts_node_t)); n->value = v; ts_push(&g_s, n); }
  return NULL;
}
static void *st_popper(void *a) { int k = *(int *)a;
  for (int i = 0; i < k; i++) { ts_node_t *n; do { n = ts_pop(&g_s); } while (!n); atomic_fetch_add(&g_sum, n->value); }
  return NULL;
}
static long st_run(int pushers, int per, int poppers) {
  ts_init(&g_s); atomic_store(&g_sum, 0);
  int total = pushers * per;
  pthread_t pt[16], ct[16]; rng_t pa[16];
  for (int i = 0; i < pushers; i++) { pa[i].from = i * per; pa[i].to = (i + 1) * per; pthread_create(&pt[i], NULL, st_pusher, &pa[i]); }
  for (int i = 0; i < pushers; i++) pthread_join(pt[i], NULL);
  int per_pop = total / poppers;
  for (int i = 0; i < poppers; i++) pthread_create(&ct[i], NULL, st_popper, &per_pop);
  for (int i = 0; i < poppers; i++) pthread_join(ct[i], NULL);
  return atomic_load(&g_sum);
}
static long expect(int total) { return (long)total * (total - 1) / 2; }

int main(void) {
  { ts_init(&g_s); for (int v = 0; v < 10; v++) { ts_node_t *n = malloc(sizeof(ts_node_t)); n->value = v; ts_push(&g_s, n); }
    long sum = 0; int cnt = 0; ts_node_t *n; while ((n = ts_pop(&g_s))) { sum += n->value; cnt++; }
    CHECK("single", sum == 45 && cnt == 10, "push 0..9 then drain should sum 45 over 10 nodes"); }
  CHECK("concurrent_push", st_run(4, 1000, 1) == expect(4000), "4 pushers then drain: sum mismatch");
  CHECK("concurrent_pop", st_run(1, 4000, 4) == expect(4000), "4 poppers draining 4000: sum mismatch");
  CHECK("push_pop_sum", st_run(4, 1000, 4) == expect(4000), "concurrent push then pop: sum mismatch");
  CHECK("stress", st_run(8, 5000, 8) == expect(40000), "8x5000 push/pop: sum mismatch");
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
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

  "m0-p-strlen": {
    id: "m0-p-strlen",
    languageId: 50,
    header: { name: "mystrlen.h", content: STRLEN_HEADER },
    driver: STRLEN_DRIVER,
    implName: "impl.c",
    learnerFileName: "mystrlen.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 3,
    wallTimeLimit: 8,
    memoryLimitKb: 131072,
    testVisibility: {
      empty: "sample",
      single_char: "hidden",
      hello: "hidden",
      with_spaces: "hidden",
      long_string: "hidden",
    },
  },

  "m0-p-memcpy": {
    id: "m0-p-memcpy",
    languageId: 50,
    header: { name: "mymemcpy.h", content: MEMCPY_HEADER },
    driver: MEMCPY_DRIVER,
    implName: "impl.c",
    learnerFileName: "mymemcpy.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 3,
    wallTimeLimit: 8,
    memoryLimitKb: 131072,
    testVisibility: {
      basic_copy: "sample",
      zero_bytes: "hidden",
      returns_dst: "hidden",
      binary_data: "hidden",
      large_copy: "hidden",
    },
  },

  "m1-p-popcount": {
    id: "m1-p-popcount",
    languageId: 50,
    header: { name: "popcount.h", content: POPCOUNT_HEADER },
    driver: POPCOUNT_DRIVER,
    implName: "impl.c",
    learnerFileName: "popcount.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 3,
    wallTimeLimit: 8,
    memoryLimitKb: 131072,
    testVisibility: {
      zero: "sample",
      one_bit: "hidden",
      byte_all_ones: "hidden",
      mixed: "hidden",
      all_32_bits: "hidden",
    },
  },

  "m1-p-saturating-add": {
    id: "m1-p-saturating-add",
    languageId: 50,
    header: { name: "satadd.h", content: SATADD_HEADER },
    driver: SATADD_DRIVER,
    implName: "impl.c",
    learnerFileName: "satadd.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 3,
    wallTimeLimit: 8,
    memoryLimitKb: 131072,
    testVisibility: {
      no_overflow: "sample",
      both_zero: "hidden",
      exact_max: "hidden",
      overflow_clamps: "hidden",
      max_plus_max: "hidden",
    },
  },

  "m1-p-bswap32": {
    id: "m1-p-bswap32",
    languageId: 50,
    header: { name: "bswap32.h", content: BSWAP_HEADER },
    driver: BSWAP_DRIVER,
    implName: "impl.c",
    learnerFileName: "bswap32.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 3,
    wallTimeLimit: 8,
    memoryLimitKb: 131072,
    testVisibility: {
      example: "sample",
      zero: "hidden",
      all_ones: "hidden",
      low_byte_only: "hidden",
      involution: "hidden",
    },
  },

  "m1-p-float-bits": {
    id: "m1-p-float-bits",
    languageId: 50,
    header: { name: "floatbits.h", content: FLOATBITS_HEADER },
    driver: FLOATBITS_DRIVER,
    implName: "impl.c",
    learnerFileName: "floatbits.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 3,
    wallTimeLimit: 8,
    memoryLimitKb: 131072,
    testVisibility: {
      one: "sample",
      zero: "hidden",
      two: "hidden",
      negative_one: "hidden",
      one_half: "hidden",
    },
  },

  "m2-p-branchless-abs": {
    id: "m2-p-branchless-abs",
    languageId: 50,
    header: { name: "babs.h", content: BABS_HEADER },
    driver: BABS_DRIVER,
    implName: "impl.c",
    learnerFileName: "babs.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 3,
    wallTimeLimit: 8,
    memoryLimitKb: 131072,
    testVisibility: {
      positive: "sample",
      negative: "hidden",
      zero: "hidden",
      large_positive: "hidden",
      large_negative: "hidden",
    },
  },

  "m2-p-conditional-select": {
    id: "m2-p-conditional-select",
    languageId: 50,
    header: { name: "select.h", content: SELECT_HEADER },
    driver: SELECT_DRIVER,
    implName: "impl.c",
    learnerFileName: "select.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 3,
    wallTimeLimit: 8,
    memoryLimitKb: 131072,
    testVisibility: {
      true_one: "sample",
      false_zero: "hidden",
      truthy_nonone: "hidden",
      negative_cond: "hidden",
      equal_values: "hidden",
    },
  },

  "m3-p-cache-sim": {
    id: "m3-p-cache-sim",
    languageId: 50,
    header: { name: "cachesim.h", content: CACHESIM_HEADER },
    driver: CACHESIM_DRIVER,
    implName: "impl.c",
    learnerFileName: "cachesim.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 3,
    wallTimeLimit: 8,
    memoryLimitKb: 131072,
    testVisibility: {
      single_miss: "sample",
      repeat_hit: "hidden",
      conflict_evict: "hidden",
      mixed_trace: "hidden",
      empty: "hidden",
    },
  },

  "m3-p-transpose": {
    id: "m3-p-transpose",
    languageId: 50,
    header: { name: "transpose.h", content: TRANSPOSE_HEADER },
    driver: TRANSPOSE_DRIVER,
    implName: "impl.c",
    learnerFileName: "transpose.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 3,
    wallTimeLimit: 8,
    memoryLimitKb: 131072,
    testVisibility: {
      one_by_one: "sample",
      two_by_two: "hidden",
      three_by_three: "hidden",
      four_by_four: "hidden",
      large_64: "hidden",
    },
  },

  "m4-p-symbol-resolve": {
    id: "m4-p-symbol-resolve",
    languageId: 50,
    header: { name: "symresolve.h", content: SYMRESOLVE_HEADER },
    driver: SYMRESOLVE_DRIVER,
    implName: "impl.c",
    learnerFileName: "symresolve.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 3,
    wallTimeLimit: 8,
    memoryLimitKb: 131072,
    testVisibility: {
      one_strong: "sample",
      one_weak: "hidden",
      strong_wins: "hidden",
      multiple_strong: "hidden",
      undefined: "hidden",
    },
  },

  "m5-p-fork-count": {
    id: "m5-p-fork-count",
    languageId: 50,
    header: { name: "forkcount.h", content: FORKCOUNT_HEADER },
    driver: FORKCOUNT_DRIVER,
    implName: "impl.c",
    learnerFileName: "forkcount.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 3,
    wallTimeLimit: 8,
    memoryLimitKb: 131072,
    testVisibility: {
      zero: "sample",
      one: "hidden",
      three: "hidden",
      ten: "hidden",
      thirtyone: "hidden",
    },
  },

  "m6-p-arena": {
    id: "m6-p-arena",
    languageId: 50,
    header: { name: "arena.h", content: ARENA_HEADER },
    driver: ARENA_DRIVER,
    implName: "impl.c",
    learnerFileName: "arena.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 3,
    wallTimeLimit: 8,
    memoryLimitKb: 131072,
    testVisibility: {
      basic_alloc: "sample",
      alignment: "hidden",
      out_of_room: "hidden",
      exhaust: "hidden",
      reset_reuse: "hidden",
    },
  },

  "m6-p-pool": {
    id: "m6-p-pool",
    languageId: 50,
    header: { name: "pool.h", content: POOL_HEADER },
    driver: POOL_DRIVER,
    implName: "impl.c",
    learnerFileName: "pool.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 3,
    wallTimeLimit: 8,
    memoryLimitKb: 131072,
    testVisibility: {
      alloc_one: "sample",
      distinct_blocks: "hidden",
      exhaust: "hidden",
      free_reuse: "hidden",
      refill: "hidden",
    },
  },

  "m7-p-spinlock": {
    id: "m7-p-spinlock",
    languageId: 50,
    header: { name: "spinlock.h", content: SPINLOCK_HEADER },
    driver: SPINLOCK_DRIVER,
    implName: "impl.c",
    learnerFileName: "spinlock.c",
    compilerOptions: "-std=c11 -O1 -g -pthread -fsanitize=thread",
    cpuTimeLimit: 6,
    wallTimeLimit: 15,
    memoryLimitKb: 262144,
    testVisibility: {
      single: "sample",
      two_threads: "hidden",
      four_threads: "hidden",
      reacquire: "hidden",
      high_contention: "hidden",
    },
  },

  "m7-p-bounded-queue": {
    id: "m7-p-bounded-queue",
    languageId: 50,
    header: { name: "bqueue.h", content: BQUEUE_HEADER },
    driver: BQUEUE_DRIVER,
    implName: "impl.c",
    learnerFileName: "bqueue.c",
    compilerOptions: "-std=c11 -O1 -g -pthread -fsanitize=address,undefined",
    cpuTimeLimit: 6,
    wallTimeLimit: 15,
    memoryLimitKb: 262144,
    testVisibility: {
      single_thread_fifo: "sample",
      spsc: "hidden",
      mpsc: "hidden",
      small_capacity: "hidden",
      mpmc: "hidden",
    },
  },

  "m7-p-thread-pool": {
    id: "m7-p-thread-pool",
    languageId: 50,
    header: { name: "threadpool.h", content: THREADPOOL_HEADER },
    driver: THREADPOOL_DRIVER,
    implName: "impl.c",
    learnerFileName: "threadpool.c",
    compilerOptions: "-std=c11 -O1 -g -pthread -fsanitize=address,undefined",
    cpuTimeLimit: 6,
    wallTimeLimit: 15,
    memoryLimitKb: 262144,
    testVisibility: {
      runs_all_small: "sample",
      single_worker: "hidden",
      many_tasks: "hidden",
      args_summed: "hidden",
      high_workers: "hidden",
    },
  },

  "m7-p-lockfree-mpsc": {
    id: "m7-p-lockfree-mpsc",
    languageId: 50,
    header: { name: "mpsc.h", content: MPSC_HEADER },
    driver: MPSC_DRIVER,
    implName: "impl.c",
    learnerFileName: "mpsc.c",
    compilerOptions: "-std=c11 -O1 -g -pthread -fsanitize=thread",
    cpuTimeLimit: 8,
    wallTimeLimit: 18,
    memoryLimitKb: 524288,
    testVisibility: {
      spsc_small: "sample",
      mpsc_two: "hidden",
      mpsc_four: "hidden",
      per_producer_fifo: "hidden",
      stress: "hidden",
    },
  },

  "m7-p-atomic-counter": {
    id: "m7-p-atomic-counter",
    languageId: 50,
    header: { name: "acounter.h", content: ACOUNTER_HEADER },
    driver: ACOUNTER_DRIVER,
    implName: "impl.c",
    learnerFileName: "acounter.c",
    compilerOptions: "-std=c11 -O1 -g -pthread -fsanitize=thread",
    cpuTimeLimit: 6,
    wallTimeLimit: 15,
    memoryLimitKb: 262144,
    testVisibility: {
      single: "sample",
      two_threads: "hidden",
      four_threads: "hidden",
      eight_threads: "hidden",
      get_value: "hidden",
    },
  },

  "m7-p-ticket-lock": {
    id: "m7-p-ticket-lock",
    languageId: 50,
    header: { name: "ticket.h", content: TICKET_HEADER },
    driver: TICKET_DRIVER,
    implName: "impl.c",
    learnerFileName: "ticket.c",
    compilerOptions: "-std=c11 -O1 -g -pthread -fsanitize=thread",
    cpuTimeLimit: 6,
    wallTimeLimit: 15,
    memoryLimitKb: 262144,
    testVisibility: {
      single: "sample",
      two_threads: "hidden",
      four_threads: "hidden",
      high_contention: "hidden",
      reacquire: "hidden",
    },
  },

  "m7-p-treiber-stack": {
    id: "m7-p-treiber-stack",
    languageId: 50,
    header: { name: "tstack.h", content: TSTACK_HEADER },
    driver: TSTACK_DRIVER,
    implName: "impl.c",
    learnerFileName: "tstack.c",
    compilerOptions: "-std=c11 -O1 -g -pthread -fsanitize=thread",
    cpuTimeLimit: 8,
    wallTimeLimit: 18,
    memoryLimitKb: 524288,
    testVisibility: {
      single: "sample",
      concurrent_push: "hidden",
      concurrent_pop: "hidden",
      push_pop_sum: "hidden",
      stress: "hidden",
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
