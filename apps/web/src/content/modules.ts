import { defineModule, type ModuleDef } from "@hasystor/content-schema";

/** Curriculum module registry (PRD §15). Lessons/problems are auto-discovered by id. */
export const modules: ModuleDef[] = [
  defineModule({
    id: "m0-orientation",
    title: "Orientation & C Bootstrap",
    order: 0,
    summary: "What systems programming is, the C mental model, and the toolchain.",
  }),
  defineModule({
    id: "m1-data",
    title: "Data: Bits, Integers, Floats",
    order: 1,
    summary: "Bit-level operations, two's complement, overflow, endianness, IEEE-754.",
  }),
  defineModule({
    id: "m2-machine",
    title: "Machine-Level x86-64",
    order: 2,
    summary: "Registers, control flow, procedures, the stack, and the ABI.",
  }),
  defineModule({
    id: "m3-performance",
    title: "Performance & Memory Hierarchy",
    order: 3,
    summary: "Caches, locality, cache-friendly code, and false sharing.",
  }),
  defineModule({
    id: "m4-linking",
    title: "Linking & Loading",
    order: 4,
    summary: "Symbols, static vs dynamic libraries, relocation, and the loader.",
  }),
  defineModule({
    id: "m5-processes",
    title: "Exceptional Control Flow & Processes",
    order: 5,
    summary: "Processes, fork/exec/wait, signals, pipes, and a tiny shell.",
  }),
  defineModule({
    id: "m6-virtual-memory",
    title: "Virtual Memory & Allocators",
    order: 6,
    summary: "Address spaces, paging, the TLB, and implementing malloc/free.",
  }),
  defineModule({
    id: "m7-concurrency",
    title: "Concurrency & Synchronization",
    order: 7,
    summary: "Threads, locks, condition variables, memory ordering, and lock-free queues.",
  }),
  defineModule({
    id: "m8-scheduling",
    title: "OS Virtualization & Scheduling",
    order: 8,
    summary: "Limited direct execution and CPU scheduling (RR, MLFQ, lottery).",
  }),
  defineModule({
    id: "m9-filesystems",
    title: "Persistence & File Systems",
    order: 9,
    summary: "Inodes, the buffer cache, journaling, and crash consistency.",
  }),
  defineModule({
    id: "m10-networking",
    title: "Networking & Sockets",
    order: 10,
    summary: "The socket API, TCP vs UDP, HTTP, and server concurrency models.",
  }),
  defineModule({
    id: "m11-storage",
    title: "Storage Engines & Databases",
    order: 11,
    summary: "B-trees, LSM-trees, write-ahead logging, caching, and MVCC.",
  }),
  defineModule({
    id: "m12-capstone",
    title: "Capstone & Interview Track",
    order: 12,
    summary: "Combine everything; curated interview implementations with trade-offs.",
  }),
];
