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

const FIFOSCHED_HEADER = `#ifndef FIFOSCHED_H
#define FIFOSCHED_H
long total_turnaround_fifo(const int *burst, int n);
#endif
`;

const FIFOSCHED_DRIVER = `#include "fifosched.h"
#include <stdio.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
  { int b[] = {100, 10, 10}; CHECK("convoy", total_turnaround_fifo(b, 3) == 330, "100+110+120 should be 330"); }
  { int b[] = {7};           CHECK("single", total_turnaround_fifo(b, 1) == 7, "single job total 7"); }
  { int b[] = {5, 5};        CHECK("two", total_turnaround_fifo(b, 2) == 15, "5+10 should be 15"); }
  { int b[] = {1, 2, 3};     CHECK("increasing", total_turnaround_fifo(b, 3) == 10, "1+3+6 should be 10"); }
  { int b[] = {2, 2, 2, 2, 2}; CHECK("five", total_turnaround_fifo(b, 5) == 30, "2+4+6+8+10 should be 30"); }
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const RRSCHED_HEADER = `#ifndef RRSCHED_H
#define RRSCHED_H
void rr_order(const int *burst, int n, int quantum, int *order_out);
#endif
`;

const RRSCHED_DRIVER = `#include "rrsched.h"
#include <stdio.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

static int arr_eq(const int *a, const int *b, int n) { for (int i = 0; i < n; i++) if (a[i] != b[i]) return 0; return 1; }

int main(void) {
  { int b[] = {5, 5, 5}; int out[3]; int exp[] = {0, 1, 2}; rr_order(b, 3, 5, out);
    CHECK("single_each", arr_eq(out, exp, 3), "each finishes in one quantum -> 0,1,2"); }
  { int b[] = {3, 1, 2}; int out[3]; int exp[] = {1, 2, 0}; rr_order(b, 3, 1, out);
    CHECK("q1_mixed", arr_eq(out, exp, 3), "expected completion order 1,2,0"); }
  { int b[] = {2, 4, 1}; int out[3]; int exp[] = {0, 1, 2}; rr_order(b, 3, 10, out);
    CHECK("big_quantum", arr_eq(out, exp, 3), "large quantum behaves like FIFO -> 0,1,2"); }
  { int b[] = {5, 3}; int out[2]; int exp[] = {1, 0}; rr_order(b, 2, 2, out);
    CHECK("q2_two", arr_eq(out, exp, 2), "expected completion order 1,0"); }
  { int b[] = {4, 1, 3, 1}; int out[4]; int exp[] = {1, 3, 0, 2}; rr_order(b, 4, 2, out);
    CHECK("four", arr_eq(out, exp, 4), "expected completion order 1,3,0,2"); }
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const LRU_HEADER = `#ifndef LRU_H
#define LRU_H
typedef struct { int cap, size; int *keys; int *vals; long *used; long tick; } lru_t;
void lru_init(lru_t *c, int *keys, int *vals, long *used, int cap);
int lru_get(lru_t *c, int key);
void lru_put(lru_t *c, int key, int value);
#endif
`;

const LRU_DRIVER = `#include "lru.h"
#include <stdio.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
  { int k[2], v[2]; long u[2]; lru_t c; lru_init(&c, k, v, u, 2);
    CHECK("get_miss", lru_get(&c, 1) == -1, "get on empty cache should be -1"); }
  { int k[2], v[2]; long u[2]; lru_t c; lru_init(&c, k, v, u, 2);
    lru_put(&c, 1, 10); CHECK("put_get", lru_get(&c, 1) == 10, "put then get should return 10"); }
  { int k[2], v[2]; long u[2]; lru_t c; lru_init(&c, k, v, u, 2);
    lru_put(&c, 1, 10); lru_put(&c, 1, 20); CHECK("update", lru_get(&c, 1) == 20, "update should overwrite value"); }
  { int k[2], v[2]; long u[2]; lru_t c; lru_init(&c, k, v, u, 2);
    lru_put(&c, 1, 10); lru_put(&c, 2, 20); lru_get(&c, 1); lru_put(&c, 3, 30);
    int ok = lru_get(&c, 2) == -1 && lru_get(&c, 1) == 10 && lru_get(&c, 3) == 30;
    CHECK("evict_lru", ok, "touching 1 then inserting 3 should evict 2"); }
  { int k[2], v[2]; long u[2]; lru_t c; lru_init(&c, k, v, u, 2);
    lru_put(&c, 1, 10); lru_put(&c, 2, 20); lru_put(&c, 3, 30);
    int ok = lru_get(&c, 1) == -1 && lru_get(&c, 2) == 20 && lru_get(&c, 3) == 30;
    CHECK("capacity", ok, "inserting a 3rd into a cap-2 cache evicts LRU (1)"); }
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const CLOCK_HEADER = `#ifndef CLOCKREPL_H
#define CLOCKREPL_H
int clock_faults(int num_frames, const int *refs, int n);
#endif
`;

const CLOCK_DRIVER = `#include "clockrepl.h"
#include <stdio.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
  { int r[] = {1, 2, 3};          CHECK("all_compulsory", clock_faults(3, r, 3) == 3, "3 cold faults"); }
  { int r[] = {1, 1, 1};          CHECK("with_repeat", clock_faults(3, r, 3) == 1, "one fault then hits"); }
  { int r[] = {1, 2, 3};          CHECK("simple_replace", clock_faults(2, r, 3) == 3, "2 frames, 3 distinct -> 3 faults"); }
  { int r[] = {1, 2, 3, 1, 4};    CHECK("hit_then_fault", clock_faults(3, r, 5) == 4, "expected 4 faults"); }
  { int r[] = {1, 2, 1, 2, 3};    CHECK("loop", clock_faults(2, r, 5) == 3, "expected 3 faults"); }
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const HTTPPARSE_HEADER = `#ifndef HTTPPARSE_H
#define HTTPPARSE_H
int http_parse(const char *req, char *method_out, char *path_out);
#endif
`;

const HTTPPARSE_DRIVER = `#include "httpparse.h"
#include <stdio.h>
#include <string.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
  char m[16], p[256];
  { int h = http_parse("GET / HTTP/1.1\\r\\nHost: x\\r\\n\\r\\n", m, p);
    CHECK("simple", h == 1 && strcmp(m, "GET") == 0 && strcmp(p, "/") == 0, "GET / with 1 header"); }
  { int h = http_parse("GET /a HTTP/1.1\\r\\nHost: x\\r\\nAccept: y\\r\\n\\r\\n", m, p);
    CHECK("two_headers", h == 2 && strcmp(m, "GET") == 0 && strcmp(p, "/a") == 0, "two headers, path /a"); }
  { int h = http_parse("POST /submit HTTP/1.0\\r\\n\\r\\n", m, p);
    CHECK("post_no_headers", h == 0 && strcmp(m, "POST") == 0 && strcmp(p, "/submit") == 0, "POST, 0 headers"); }
  { int h = http_parse("GET\\r\\n\\r\\n", m, p); CHECK("malformed_short", h == -1, "missing tokens should be -1"); }
  { int h = http_parse("GET / FOO\\r\\n\\r\\n", m, p); CHECK("malformed_version", h == -1, "bad version should be -1"); }
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const ICHECKSUM_HEADER = `#ifndef ICHECKSUM_H
#define ICHECKSUM_H
unsigned short inet_checksum(const unsigned char *data, int len);
#endif
`;

const ICHECKSUM_DRIVER = `#include "ichecksum.h"
#include <stdio.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
  { unsigned char d[] = {0x12, 0x34}; CHECK("two_bytes", inet_checksum(d, 2) == 0xEDCB, "expected 0xEDCB"); }
  { unsigned char d[1] = {0}; CHECK("empty", inet_checksum(d, 0) == 0xFFFF, "empty should be 0xFFFF"); }
  { unsigned char d[] = {0x12, 0x34, 0x56, 0x78}; CHECK("four_bytes", inet_checksum(d, 4) == 0x9753, "expected 0x9753"); }
  { unsigned char d[] = {0x12, 0x34, 0x56}; CHECK("odd_length", inet_checksum(d, 3) == 0x97CB, "expected 0x97CB"); }
  { unsigned char d[] = {0xFF, 0xFF, 0xFF, 0xFF}; CHECK("carry_fold", inet_checksum(d, 4) == 0x0000, "expected 0x0000"); }
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const BTREESEARCH_HEADER = `#ifndef BTREESEARCH_H
#define BTREESEARCH_H
int node_lower_bound(const int *keys, int n, int target);
#endif
`;

const BTREESEARCH_DRIVER = `#include "btreesearch.h"
#include <stdio.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
  { int k[] = {10, 20, 30}; CHECK("exact", node_lower_bound(k, 3, 20) == 1, "first >=20 should be index 1"); }
  { int k[] = {10, 20, 30}; CHECK("between", node_lower_bound(k, 3, 15) == 1, "first >=15 should be index 1"); }
  { int k[] = {10, 20, 30}; CHECK("before_all", node_lower_bound(k, 3, 5) == 0, "first >=5 should be index 0"); }
  { int k[] = {10, 20, 30}; CHECK("after_all", node_lower_bound(k, 3, 40) == 3, "all < 40 should return n=3"); }
  { int k[1000]; for (int i = 0; i < 1000; i++) k[i] = 2 * i; CHECK("large", node_lower_bound(k, 1000, 1001) == 501, "first >=1001 should be index 501"); }
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const LSMMERGE_HEADER = `#ifndef LSMMERGE_H
#define LSMMERGE_H
int lsm_merge(const int *k1, const int *v1, int n1,
              const int *k2, const int *v2, int n2,
              int *ko, int *vo);
#endif
`;

const LSMMERGE_DRIVER = `#include "lsmmerge.h"
#include <stdio.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

static int eq(const int *a, const int *b, int n) { for (int i = 0; i < n; i++) if (a[i] != b[i]) return 0; return 1; }

int main(void) {
  { int k1[] = {1, 3}, v1[] = {10, 30}, k2[] = {2, 4}, v2[] = {20, 40}; int ko[4], vo[4];
    int n = lsm_merge(k1, v1, 2, k2, v2, 2, ko, vo);
    int ek[] = {1, 2, 3, 4}, ev[] = {10, 20, 30, 40};
    CHECK("disjoint", n == 4 && eq(ko, ek, 4) && eq(vo, ev, 4), "disjoint merge failed"); }
  { int k1[] = {1, 2, 3}, v1[] = {10, 20, 30}, k2[] = {2}, v2[] = {99}; int ko[3], vo[3];
    int n = lsm_merge(k1, v1, 3, k2, v2, 1, ko, vo);
    int ek[] = {1, 2, 3}, ev[] = {10, 99, 30};
    CHECK("overlap_newer_wins", n == 3 && eq(ko, ek, 3) && eq(vo, ev, 3), "newer value should win on key 2"); }
  { int k2[] = {1, 2}, v2[] = {1, 2}; int ko[2], vo[2];
    int n = lsm_merge(0, 0, 0, k2, v2, 2, ko, vo);
    int ek[] = {1, 2}, ev[] = {1, 2};
    CHECK("empty_a", n == 2 && eq(ko, ek, 2) && eq(vo, ev, 2), "empty run A failed"); }
  { int k1[] = {5}, v1[] = {50}; int ko[1], vo[1];
    int n = lsm_merge(k1, v1, 1, 0, 0, 0, ko, vo);
    CHECK("empty_b", n == 1 && ko[0] == 5 && vo[0] == 50, "empty run B failed"); }
  { int k1[] = {1, 2}, v1[] = {1, 2}, k2[] = {1, 2}, v2[] = {9, 8}; int ko[2], vo[2];
    int n = lsm_merge(k1, v1, 2, k2, v2, 2, ko, vo);
    int ek[] = {1, 2}, ev[] = {9, 8};
    CHECK("all_overlap", n == 2 && eq(ko, ek, 2) && eq(vo, ev, 2), "all-overlap newer wins failed"); }
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

const KVMAP_HEADER = `#ifndef KVMAP_H
#define KVMAP_H
typedef struct { int *keys; int *vals; char *state; int cap; int size; } kvmap_t;
void kv_init(kvmap_t *m, int *keys, int *vals, char *state, int cap);
void kv_put(kvmap_t *m, int key, int val);
int kv_get(kvmap_t *m, int key, int *found);
void kv_del(kvmap_t *m, int key);
#endif
`;

const KVMAP_DRIVER = `#include "kvmap.h"
#include <stdio.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
  { int k[8], v[8]; char s[8]; kvmap_t m; kv_init(&m, k, v, s, 8);
    kv_put(&m, 1, 100); int f; int val = kv_get(&m, 1, &f);
    CHECK("put_get", f == 1 && val == 100, "put then get should return 100"); }
  { int k[8], v[8]; char s[8]; kvmap_t m; kv_init(&m, k, v, s, 8);
    int f; kv_get(&m, 99, &f); CHECK("missing", f == 0, "absent key should not be found"); }
  { int k[8], v[8]; char s[8]; kvmap_t m; kv_init(&m, k, v, s, 8);
    kv_put(&m, 1, 1); kv_put(&m, 1, 2); int f; int val = kv_get(&m, 1, &f);
    CHECK("overwrite", f == 1 && val == 2 && m.size == 1, "overwrite should update value and keep size 1"); }
  { int k[4], v[4]; char s[4]; kvmap_t m; kv_init(&m, k, v, s, 4);
    kv_put(&m, 1, 10); kv_put(&m, 5, 50); int f1, f5; int a = kv_get(&m, 1, &f1); int b = kv_get(&m, 5, &f5);
    CHECK("collision", f1 && a == 10 && f5 && b == 50, "colliding keys (1 and 5) should both be retrievable"); }
  { int k[4], v[4]; char s[4]; kvmap_t m; kv_init(&m, k, v, s, 4);
    kv_put(&m, 1, 10); kv_put(&m, 5, 50); kv_del(&m, 1);
    int f5; int b = kv_get(&m, 5, &f5); int f1; kv_get(&m, 1, &f1);
    CHECK("delete_probe", f5 && b == 50 && f1 == 0, "after deleting 1, key 5 must still be found and 1 not"); }
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;

function bitDriver(header: string, body: string): string {
  return `#include "${header}"
#include <stdio.h>
#include <stdint.h>

static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { \\
  g_total++; \\
  if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } \\
  else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } \\
} while (0)

int main(void) {
${body}
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}

#include "impl.c"
`;
}

const REVBITS_HEADER = `#ifndef REVBITS_H
#define REVBITS_H
#include <stdint.h>
uint32_t reverse_bits(uint32_t x);
#endif
`;
const REVBITS_DRIVER = bitDriver("revbits.h",
  '  CHECK("zero", reverse_bits(0u) == 0u, "0 reverses to 0");\n' +
  '  CHECK("one", reverse_bits(1u) == 0x80000000u, "1 reverses to 0x80000000");\n' +
  '  CHECK("top_bit", reverse_bits(0x80000000u) == 1u, "0x80000000 reverses to 1");\n' +
  '  CHECK("all_ones", reverse_bits(0xFFFFFFFFu) == 0xFFFFFFFFu, "all ones reverses to all ones");\n' +
  '  CHECK("two", reverse_bits(2u) == 0x40000000u, "0x2 reverses to 0x40000000");');

const PARITY_HEADER = `#ifndef PARITY_H
#define PARITY_H
#include <stdint.h>
int parity(uint32_t x);
#endif
`;
const PARITY_DRIVER = bitDriver("parity.h",
  '  CHECK("zero", parity(0u) == 0, "0 has even parity");\n' +
  '  CHECK("one", parity(1u) == 1, "1 has odd parity");\n' +
  '  CHECK("three_bits", parity(0xBu) == 1, "0b1011 has 3 set bits (odd)");\n' +
  '  CHECK("seven", parity(7u) == 1, "0b111 has 3 set bits (odd)");\n' +
  '  CHECK("all_ones", parity(0xFFFFFFFFu) == 0, "32 set bits is even");');

const CLZ_HEADER = `#ifndef CLZ_H
#define CLZ_H
#include <stdint.h>
int count_leading_zeros(uint32_t x);
#endif
`;
const CLZ_DRIVER = bitDriver("clz.h",
  '  CHECK("one", count_leading_zeros(1u) == 31, "clz(1) should be 31");\n' +
  '  CHECK("zero", count_leading_zeros(0u) == 32, "clz(0) should be 32");\n' +
  '  CHECK("top_bit", count_leading_zeros(0x80000000u) == 0, "clz(0x80000000) should be 0");\n' +
  '  CHECK("byte", count_leading_zeros(0xFFu) == 24, "clz(0xFF) should be 24");\n' +
  '  CHECK("all_ones", count_leading_zeros(0xFFFFFFFFu) == 0, "clz(all ones) should be 0");');

const NEXTPOW2_HEADER = `#ifndef NEXTPOW2_H
#define NEXTPOW2_H
#include <stdint.h>
uint32_t next_pow2(uint32_t x);
#endif
`;
const NEXTPOW2_DRIVER = bitDriver("nextpow2.h",
  '  CHECK("five", next_pow2(5u) == 8u, "next_pow2(5) should be 8");\n' +
  '  CHECK("zero", next_pow2(0u) == 1u, "next_pow2(0) should be 1");\n' +
  '  CHECK("exact", next_pow2(8u) == 8u, "next_pow2(8) should be 8");\n' +
  '  CHECK("seventeen", next_pow2(17u) == 32u, "next_pow2(17) should be 32");\n' +
  '  CHECK("large", next_pow2(0x40000000u) == 0x40000000u, "exact large power stays");');

const GRAY_HEADER = `#ifndef GRAY_H
#define GRAY_H
#include <stdint.h>
uint32_t binary_to_gray(uint32_t x);
#endif
`;
const GRAY_DRIVER = bitDriver("gray.h",
  '  CHECK("two", binary_to_gray(2u) == 3u, "gray(2) should be 3");\n' +
  '  CHECK("zero", binary_to_gray(0u) == 0u, "gray(0) should be 0");\n' +
  '  CHECK("one", binary_to_gray(1u) == 1u, "gray(1) should be 1");\n' +
  '  CHECK("three", binary_to_gray(3u) == 2u, "gray(3) should be 2");\n' +
  '  CHECK("four", binary_to_gray(4u) == 6u, "gray(4) should be 6");');

const MYSTRCMP_HEADER = `#ifndef MYSTRCMP_H
#define MYSTRCMP_H
int my_strcmp(const char *a, const char *b);
#endif
`;
const MYSTRCMP_DRIVER = `#include "mystrcmp.h"
#include <stdio.h>
static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { g_total++; if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } } while (0)
int main(void) {
  CHECK("equal", my_strcmp("abc", "abc") == 0, "equal strings -> 0");
  CHECK("less", my_strcmp("abc", "abd") < 0, "abc should be < abd");
  CHECK("greater", my_strcmp("abd", "abc") > 0, "abd should be > abc");
  CHECK("prefix", my_strcmp("ab", "abc") < 0, "prefix should be < longer");
  CHECK("empty", my_strcmp("", "") == 0, "empty strings equal");
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}
#include "impl.c"
`;

const MYMEMSET_HEADER = `#ifndef MYMEMSET_H
#define MYMEMSET_H
#include <stddef.h>
void *my_memset(void *dst, int c, size_t n);
#endif
`;
const MYMEMSET_DRIVER = `#include "mymemset.h"
#include <stdio.h>
#include <string.h>
static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { g_total++; if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } } while (0)
int main(void) {
  { char b[6]; my_memset(b, 'A', 5); b[5] = '\\0'; CHECK("fill_char", strcmp(b, "AAAAA") == 0, "should fill 5 A's"); }
  { char b[4] = "xyz"; void *r = my_memset(b, 'q', 3); CHECK("returns_dst", r == b && b[0] == 'q' && b[2] == 'q', "returns dst and fills"); }
  { unsigned char b[3] = {1, 2, 3}; my_memset(b, 9, 0); CHECK("zero_n", b[0] == 1, "n=0 changes nothing"); }
  { unsigned char b[4] = {1, 1, 1, 1}; my_memset(b, 0, 4); CHECK("fill_zero", b[0] == 0 && b[3] == 0, "fill zeros"); }
  { unsigned char b[4] = {1, 1, 1, 1}; my_memset(b, 7, 2); CHECK("partial", b[0] == 7 && b[1] == 7 && b[2] == 1 && b[3] == 1, "only first 2 bytes"); }
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}
#include "impl.c"
`;

const MYATOI_HEADER = `#ifndef MYATOI_H
#define MYATOI_H
int my_atoi(const char *s);
#endif
`;
const MYATOI_DRIVER = `#include "myatoi.h"
#include <stdio.h>
static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { g_total++; if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } } while (0)
int main(void) {
  CHECK("digits", my_atoi("123") == 123, "123");
  CHECK("negative", my_atoi("-45") == -45, "-45");
  CHECK("plus", my_atoi("+7") == 7, "+7");
  CHECK("trailing", my_atoi("42abc") == 42, "stop at first non-digit");
  CHECK("zero", my_atoi("0") == 0, "0");
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}
#include "impl.c"
`;

const MYSTRCHR_HEADER = `#ifndef MYSTRCHR_H
#define MYSTRCHR_H
char *my_strchr(const char *s, int c);
#endif
`;
const MYSTRCHR_DRIVER = `#include "mystrchr.h"
#include <stdio.h>
static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { g_total++; if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } } while (0)
int main(void) {
  const char *s = "hello";
  CHECK("found", my_strchr(s, 'l') == s + 2, "first l at index 2");
  CHECK("first_occurrence", my_strchr(s, 'l') == s + 2, "should return the FIRST l");
  CHECK("not_found", my_strchr(s, 'z') == 0, "absent char -> NULL");
  CHECK("terminator", my_strchr(s, '\\0') == s + 5, "searching '\\\\0' returns the terminator");
  CHECK("at_start", my_strchr(s, 'h') == s, "h at index 0");
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}
#include "impl.c"
`;

const RWLOCK_HEADER = `#ifndef RWLOCK_H
#define RWLOCK_H
#include <pthread.h>
typedef struct { pthread_mutex_t m; pthread_cond_t c; int readers; int writing; } rwlock_t;
void rw_init(rwlock_t *l);
void rw_rlock(rwlock_t *l);
void rw_runlock(rwlock_t *l);
void rw_wlock(rwlock_t *l);
void rw_wunlock(rwlock_t *l);
#endif
`;
const RWLOCK_DRIVER = `#include "rwlock.h"
#include <stdio.h>
#include <pthread.h>
static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { g_total++; if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } } while (0)
static rwlock_t g_l; static long g_counter; static int g_witers, g_riters;
static void *writer(void *u) { (void)u; for (int i = 0; i < g_witers; i++) { rw_wlock(&g_l); g_counter++; rw_wunlock(&g_l); } return NULL; }
static void *reader(void *u) { (void)u; volatile long sink = 0; for (int i = 0; i < g_riters; i++) { rw_rlock(&g_l); sink += g_counter; rw_runlock(&g_l); } (void)sink; return NULL; }
static long run(int nw, int witers, int nr, int riters) {
  rw_init(&g_l); g_counter = 0; g_witers = witers; g_riters = riters;
  pthread_t w[16], r[16];
  for (int i = 0; i < nw; i++) pthread_create(&w[i], 0, writer, 0);
  for (int i = 0; i < nr; i++) pthread_create(&r[i], 0, reader, 0);
  for (int i = 0; i < nw; i++) pthread_join(w[i], 0);
  for (int i = 0; i < nr; i++) pthread_join(r[i], 0);
  return g_counter;
}
int main(void) {
  CHECK("one_writer", run(1, 1000, 0, 0) == 1000, "1 writer x1000");
  CHECK("writers", run(4, 50000, 0, 0) == 200000, "4 writers x50000");
  CHECK("readers_and_writers", run(4, 50000, 4, 10000) == 200000, "writer count exact with readers present");
  CHECK("high_contention", run(8, 20000, 2, 5000) == 160000, "8 writers x20000");
  CHECK("reacquire", run(1, 3, 1, 3) == 3, "basic reacquire");
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}
#include "impl.c"
`;

const CSEM_HEADER = `#ifndef CSEM_H
#define CSEM_H
#include <pthread.h>
typedef struct { pthread_mutex_t m; pthread_cond_t c; int count; } csem_t;
void csem_init(csem_t *s, int value);
void csem_wait(csem_t *s);
void csem_post(csem_t *s);
#endif
`;
const CSEM_DRIVER = `#include "csem.h"
#include <stdio.h>
#include <pthread.h>
#include <stdatomic.h>
static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { g_total++; if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } } while (0)
static csem_t g_mux; static long g_counter; static int g_iters;
static void *muxworker(void *u) { (void)u; for (int i = 0; i < g_iters; i++) { csem_wait(&g_mux); g_counter++; csem_post(&g_mux); } return NULL; }
static long run_mutex(int n, int iters) {
  csem_init(&g_mux, 1); g_counter = 0; g_iters = iters;
  pthread_t t[16];
  for (int i = 0; i < n; i++) pthread_create(&t[i], 0, muxworker, 0);
  for (int i = 0; i < n; i++) pthread_join(t[i], 0);
  return g_counter;
}
static csem_t g_sig; static atomic_int g_done;
static void *waiter(void *u) { (void)u; csem_wait(&g_sig); atomic_fetch_add(&g_done, 1); return NULL; }
static int run_signal(int n) {
  csem_init(&g_sig, 0); atomic_store(&g_done, 0);
  pthread_t t[16];
  for (int i = 0; i < n; i++) pthread_create(&t[i], 0, waiter, 0);
  for (int i = 0; i < n; i++) csem_post(&g_sig);
  for (int i = 0; i < n; i++) pthread_join(t[i], 0);
  return atomic_load(&g_done);
}
int main(void) {
  CHECK("as_mutex", run_mutex(4, 50000) == 200000, "sem(1) as mutex should give exact count");
  CHECK("signal_release", run_signal(4) == 4, "4 posts should release 4 waiters");
  { csem_t s; csem_init(&s, 2); csem_wait(&s); csem_wait(&s); CHECK("permits", 1, "two permits acquired without blocking"); }
  CHECK("high_contention", run_mutex(8, 20000) == 160000, "8x20000 as mutex");
  { csem_t s; csem_init(&s, 0); csem_post(&s); csem_wait(&s); CHECK("post_before_wait", 1, "post then wait must not block or lose the post"); }
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}
#include "impl.c"
`;

const SPSC_HEADER = `#ifndef SPSC_H
#define SPSC_H
#include <stdatomic.h>
typedef struct { int *buf; unsigned cap; _Atomic unsigned head; _Atomic unsigned tail; } spsc_t;
void spsc_init(spsc_t *q, int *storage, unsigned cap);
int spsc_push(spsc_t *q, int v);
int spsc_pop(spsc_t *q, int *out);
#endif
`;
const SPSC_DRIVER = `#include "spsc.h"
#include <stdio.h>
#include <pthread.h>
static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { g_total++; if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } } while (0)
static spsc_t g_q; static int g_n; static volatile int g_ok;
static void *producer(void *u) { (void)u; int v = 0; while (v < g_n) { if (spsc_push(&g_q, v)) v++; } return NULL; }
static void *consumer(void *u) { (void)u; int expect = 0; while (expect < g_n) { int o; if (spsc_pop(&g_q, &o)) { if (o != expect) g_ok = 0; expect++; } } return NULL; }
static int run(unsigned cap, int n) {
  static int storage[4096];
  spsc_init(&g_q, storage, cap); g_n = n; g_ok = 1;
  pthread_t p, c; pthread_create(&p, 0, producer, 0); pthread_create(&c, 0, consumer, 0);
  pthread_join(p, 0); pthread_join(c, 0); return g_ok;
}
int main(void) {
  { static int st[4]; spsc_t q; spsc_init(&q, st, 4); int o; int ok = 1;
    ok &= spsc_push(&q, 10); ok &= spsc_push(&q, 20);
    ok &= (spsc_pop(&q, &o) && o == 10); ok &= (spsc_pop(&q, &o) && o == 20); ok &= (spsc_pop(&q, &o) == 0);
    CHECK("single_thread", ok, "basic FIFO push/pop"); }
  CHECK("small_cap", run(2, 100000), "cap=2 concurrent ordered stream");
  CHECK("stream_order", run(1024, 200000), "ordered stream of 200000");
  { static int st[2]; spsc_t q; spsc_init(&q, st, 2); int o; int ok = 1;
    ok &= spsc_push(&q, 1); ok &= spsc_push(&q, 2); ok &= (spsc_push(&q, 3) == 0);
    ok &= (spsc_pop(&q, &o) && o == 1); ok &= spsc_push(&q, 3);
    CHECK("full_empty", ok, "full returns 0; pop frees a slot"); }
  CHECK("stress", run(256, 500000), "stress ordered stream");
  printf("HASYSTOR_SUMMARY passed=%d total=%d\\n", g_pass, g_total);
  return g_pass == g_total ? 0 : 1;
}
#include "impl.c"
`;

const DINING_HEADER = `#ifndef DINING_H
#define DINING_H
#include <pthread.h>
void dine(int id, int n, pthread_mutex_t *forks, int eat_count, int *ate);
#endif
`;
const DINING_DRIVER = `#include "dining.h"
#include <stdio.h>
#include <pthread.h>
static int g_pass = 0, g_total = 0;
#define CHECK(name, cond, msg) do { g_total++; if (cond) { g_pass++; printf("HASYSTOR_TEST name=\\"%s\\" status=PASS\\n", name); } else { printf("HASYSTOR_TEST name=\\"%s\\" status=FAIL msg=\\"%s\\"\\n", name, msg); } } while (0)
static pthread_mutex_t g_forks[64]; static int g_n, g_eat, g_ate[64];
typedef struct { int id; } darg;
static void *phil(void *a) { darg *d = a; dine(d->id, g_n, g_forks, g_eat, g_ate); return NULL; }
static int run(int n, int eat) {
  g_n = n; g_eat = eat;
  for (int i = 0; i < n; i++) { pthread_mutex_init(&g_forks[i], 0); g_ate[i] = 0; }
  pthread_t t[64]; darg args[64];
  for (int i = 0; i < n; i++) { args[i].id = i; pthread_create(&t[i], 0, phil, &args[i]); }
  for (int i = 0; i < n; i++) pthread_join(t[i], 0);
  int ok = 1; for (int i = 0; i < n; i++) if (g_ate[i] != eat) ok = 0; return ok;
}
int main(void) {
  CHECK("two", run(2, 100), "2 philosophers each eat 100");
  CHECK("three", run(3, 1000), "3 philosophers each eat 1000");
  CHECK("five", run(5, 1000), "5 philosophers each eat 1000");
  CHECK("many_meals", run(5, 10000), "5 philosophers each eat 10000");
  CHECK("large_table", run(16, 500), "16 philosophers each eat 500");
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

  "m8-p-fifo-turnaround": {
    id: "m8-p-fifo-turnaround",
    languageId: 50,
    header: { name: "fifosched.h", content: FIFOSCHED_HEADER },
    driver: FIFOSCHED_DRIVER,
    implName: "impl.c",
    learnerFileName: "fifosched.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 2,
    wallTimeLimit: 5,
    memoryLimitKb: 65536,
    testVisibility: {
      convoy: "sample",
      single: "hidden",
      two: "hidden",
      increasing: "hidden",
      five: "hidden",
    },
  },

  "m8-p-rr-order": {
    id: "m8-p-rr-order",
    languageId: 50,
    header: { name: "rrsched.h", content: RRSCHED_HEADER },
    driver: RRSCHED_DRIVER,
    implName: "impl.c",
    learnerFileName: "rrsched.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 2,
    wallTimeLimit: 5,
    memoryLimitKb: 65536,
    testVisibility: {
      single_each: "sample",
      q1_mixed: "hidden",
      big_quantum: "hidden",
      q2_two: "hidden",
      four: "hidden",
    },
  },

  "m9-p-lru-cache": {
    id: "m9-p-lru-cache",
    languageId: 50,
    header: { name: "lru.h", content: LRU_HEADER },
    driver: LRU_DRIVER,
    implName: "impl.c",
    learnerFileName: "lru.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 2,
    wallTimeLimit: 5,
    memoryLimitKb: 65536,
    testVisibility: {
      get_miss: "sample",
      put_get: "hidden",
      update: "hidden",
      evict_lru: "hidden",
      capacity: "hidden",
    },
  },

  "m9-p-clock": {
    id: "m9-p-clock",
    languageId: 50,
    header: { name: "clockrepl.h", content: CLOCK_HEADER },
    driver: CLOCK_DRIVER,
    implName: "impl.c",
    learnerFileName: "clockrepl.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 2,
    wallTimeLimit: 5,
    memoryLimitKb: 65536,
    testVisibility: {
      all_compulsory: "sample",
      with_repeat: "hidden",
      simple_replace: "hidden",
      hit_then_fault: "hidden",
      loop: "hidden",
    },
  },

  "m10-p-http-parse": {
    id: "m10-p-http-parse",
    languageId: 50,
    header: { name: "httpparse.h", content: HTTPPARSE_HEADER },
    driver: HTTPPARSE_DRIVER,
    implName: "impl.c",
    learnerFileName: "httpparse.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 2,
    wallTimeLimit: 5,
    memoryLimitKb: 65536,
    testVisibility: {
      simple: "sample",
      two_headers: "hidden",
      post_no_headers: "hidden",
      malformed_short: "hidden",
      malformed_version: "hidden",
    },
  },

  "m10-p-checksum": {
    id: "m10-p-checksum",
    languageId: 50,
    header: { name: "ichecksum.h", content: ICHECKSUM_HEADER },
    driver: ICHECKSUM_DRIVER,
    implName: "impl.c",
    learnerFileName: "ichecksum.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 2,
    wallTimeLimit: 5,
    memoryLimitKb: 65536,
    testVisibility: {
      two_bytes: "sample",
      empty: "hidden",
      four_bytes: "hidden",
      odd_length: "hidden",
      carry_fold: "hidden",
    },
  },

  "m11-p-btree-search": {
    id: "m11-p-btree-search",
    languageId: 50,
    header: { name: "btreesearch.h", content: BTREESEARCH_HEADER },
    driver: BTREESEARCH_DRIVER,
    implName: "impl.c",
    learnerFileName: "btreesearch.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 2,
    wallTimeLimit: 5,
    memoryLimitKb: 65536,
    testVisibility: {
      exact: "sample",
      between: "hidden",
      before_all: "hidden",
      after_all: "hidden",
      large: "hidden",
    },
  },

  "m11-p-lsm-merge": {
    id: "m11-p-lsm-merge",
    languageId: 50,
    header: { name: "lsmmerge.h", content: LSMMERGE_HEADER },
    driver: LSMMERGE_DRIVER,
    implName: "impl.c",
    learnerFileName: "lsmmerge.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 2,
    wallTimeLimit: 5,
    memoryLimitKb: 65536,
    testVisibility: {
      disjoint: "sample",
      overlap_newer_wins: "hidden",
      empty_a: "hidden",
      empty_b: "hidden",
      all_overlap: "hidden",
    },
  },

  "m12-p-hashmap": {
    id: "m12-p-hashmap",
    languageId: 50,
    header: { name: "kvmap.h", content: KVMAP_HEADER },
    driver: KVMAP_DRIVER,
    implName: "impl.c",
    learnerFileName: "kvmap.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 2,
    wallTimeLimit: 5,
    memoryLimitKb: 65536,
    testVisibility: {
      put_get: "sample",
      missing: "hidden",
      overwrite: "hidden",
      collision: "hidden",
      delete_probe: "hidden",
    },
  },

  "m1-p-reverse-bits": {
    id: "m1-p-reverse-bits", languageId: 50,
    header: { name: "revbits.h", content: REVBITS_HEADER }, driver: REVBITS_DRIVER,
    implName: "impl.c", learnerFileName: "revbits.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 2, wallTimeLimit: 5, memoryLimitKb: 65536,
    testVisibility: { zero: "sample", one: "hidden", top_bit: "hidden", all_ones: "hidden", two: "hidden" },
  },
  "m1-p-parity": {
    id: "m1-p-parity", languageId: 50,
    header: { name: "parity.h", content: PARITY_HEADER }, driver: PARITY_DRIVER,
    implName: "impl.c", learnerFileName: "parity.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 2, wallTimeLimit: 5, memoryLimitKb: 65536,
    testVisibility: { zero: "sample", one: "hidden", three_bits: "hidden", seven: "hidden", all_ones: "hidden" },
  },
  "m1-p-clz": {
    id: "m1-p-clz", languageId: 50,
    header: { name: "clz.h", content: CLZ_HEADER }, driver: CLZ_DRIVER,
    implName: "impl.c", learnerFileName: "clz.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 2, wallTimeLimit: 5, memoryLimitKb: 65536,
    testVisibility: { one: "sample", zero: "hidden", top_bit: "hidden", byte: "hidden", all_ones: "hidden" },
  },
  "m1-p-next-pow2": {
    id: "m1-p-next-pow2", languageId: 50,
    header: { name: "nextpow2.h", content: NEXTPOW2_HEADER }, driver: NEXTPOW2_DRIVER,
    implName: "impl.c", learnerFileName: "nextpow2.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 2, wallTimeLimit: 5, memoryLimitKb: 65536,
    testVisibility: { five: "sample", zero: "hidden", exact: "hidden", seventeen: "hidden", large: "hidden" },
  },
  "m1-p-binary-to-gray": {
    id: "m1-p-binary-to-gray", languageId: 50,
    header: { name: "gray.h", content: GRAY_HEADER }, driver: GRAY_DRIVER,
    implName: "impl.c", learnerFileName: "gray.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 2, wallTimeLimit: 5, memoryLimitKb: 65536,
    testVisibility: { two: "sample", zero: "hidden", one: "hidden", three: "hidden", four: "hidden" },
  },

  "m0-p-strcmp": {
    id: "m0-p-strcmp", languageId: 50,
    header: { name: "mystrcmp.h", content: MYSTRCMP_HEADER }, driver: MYSTRCMP_DRIVER,
    implName: "impl.c", learnerFileName: "mystrcmp.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 2, wallTimeLimit: 5, memoryLimitKb: 65536,
    testVisibility: { equal: "sample", less: "hidden", greater: "hidden", prefix: "hidden", empty: "hidden" },
  },
  "m0-p-memset": {
    id: "m0-p-memset", languageId: 50,
    header: { name: "mymemset.h", content: MYMEMSET_HEADER }, driver: MYMEMSET_DRIVER,
    implName: "impl.c", learnerFileName: "mymemset.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 2, wallTimeLimit: 5, memoryLimitKb: 65536,
    testVisibility: { fill_char: "sample", returns_dst: "hidden", zero_n: "hidden", fill_zero: "hidden", partial: "hidden" },
  },
  "m0-p-atoi": {
    id: "m0-p-atoi", languageId: 50,
    header: { name: "myatoi.h", content: MYATOI_HEADER }, driver: MYATOI_DRIVER,
    implName: "impl.c", learnerFileName: "myatoi.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 2, wallTimeLimit: 5, memoryLimitKb: 65536,
    testVisibility: { digits: "sample", negative: "hidden", plus: "hidden", trailing: "hidden", zero: "hidden" },
  },
  "m0-p-strchr": {
    id: "m0-p-strchr", languageId: 50,
    header: { name: "mystrchr.h", content: MYSTRCHR_HEADER }, driver: MYSTRCHR_DRIVER,
    implName: "impl.c", learnerFileName: "mystrchr.c",
    compilerOptions: "-std=c11 -O1 -g -fsanitize=address,undefined",
    cpuTimeLimit: 2, wallTimeLimit: 5, memoryLimitKb: 65536,
    testVisibility: { found: "sample", first_occurrence: "hidden", not_found: "hidden", terminator: "hidden", at_start: "hidden" },
  },
  "m7-p-rwlock": {
    id: "m7-p-rwlock", languageId: 50,
    header: { name: "rwlock.h", content: RWLOCK_HEADER }, driver: RWLOCK_DRIVER,
    implName: "impl.c", learnerFileName: "rwlock.c",
    compilerOptions: "-std=c11 -O1 -g -pthread -fsanitize=address,undefined",
    cpuTimeLimit: 6, wallTimeLimit: 15, memoryLimitKb: 262144,
    testVisibility: { one_writer: "sample", writers: "hidden", readers_and_writers: "hidden", high_contention: "hidden", reacquire: "hidden" },
  },
  "m7-p-semaphore": {
    id: "m7-p-semaphore", languageId: 50,
    header: { name: "csem.h", content: CSEM_HEADER }, driver: CSEM_DRIVER,
    implName: "impl.c", learnerFileName: "csem.c",
    compilerOptions: "-std=c11 -O1 -g -pthread -fsanitize=address,undefined",
    cpuTimeLimit: 6, wallTimeLimit: 15, memoryLimitKb: 262144,
    testVisibility: { as_mutex: "sample", signal_release: "hidden", permits: "hidden", high_contention: "hidden", post_before_wait: "hidden" },
  },
  "m7-p-spsc-ring": {
    id: "m7-p-spsc-ring", languageId: 50,
    header: { name: "spsc.h", content: SPSC_HEADER }, driver: SPSC_DRIVER,
    implName: "impl.c", learnerFileName: "spsc.c",
    compilerOptions: "-std=c11 -O1 -g -pthread -fsanitize=thread",
    cpuTimeLimit: 8, wallTimeLimit: 18, memoryLimitKb: 262144,
    testVisibility: { single_thread: "sample", small_cap: "hidden", stream_order: "hidden", full_empty: "hidden", stress: "hidden" },
  },
  "m7-p-dining": {
    id: "m7-p-dining", languageId: 50,
    header: { name: "dining.h", content: DINING_HEADER }, driver: DINING_DRIVER,
    implName: "impl.c", learnerFileName: "dining.c",
    compilerOptions: "-std=c11 -O1 -g -pthread -fsanitize=address,undefined",
    cpuTimeLimit: 6, wallTimeLimit: 15, memoryLimitKb: 262144,
    testVisibility: { two: "sample", three: "hidden", five: "hidden", many_meals: "hidden", large_table: "hidden" },
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
