# HastOS — Source Textbooks & Reference Catalog

Curated **free, online** systems texts used as the authoritative topic map for the HastOS
curriculum. These are the sources we mine to keep expanding lessons and problems (the "read the
books, extract what's missing, add it" loop). All links verified 2026-07.

> Licensing note: we do **not** copy text from these sources. We use them as a topic map and author
> original lessons/problems covering the same material. Where a book is paid (e.g., CS:APP), only
> its free site/labs are linked.

## Core systems (machine, memory, performance) — Modules M0–M6
- **Dive Into Systems** (free, full) — https://diveintosystems.org/ — C, machine code, memory
  hierarchy, storage, parallelism. Closest free analog to CS:APP.
- **CS:APP — Computer Systems: A Programmer's Perspective** (paid book; free site + labs) —
  http://csapp.cs.cmu.edu/ — DataLab/BombLab/AttackLab/MallocLab problem inspiration.
- **Beej's Guide to C** — https://beej.us/guide/bgc/ — thorough free C reference.
- **Programming from the Ground Up** (free, assembly) — https://savannah.nongnu.org/projects/pgubook/
  — x86 assembly from first principles (M2).
- **nand2tetris** (free) — https://www.nand2tetris.org/ — build a computer from logic gates up.

## Operating systems (processes, VM, concurrency, scheduling, FS) — Modules M5–M9
- **OSTEP — Operating Systems: Three Easy Pieces** (free PDFs) —
  https://pages.cs.wisc.edu/~remzi/OSTEP/ — virtualization, concurrency, persistence. The backbone
  OS text. Per-chapter PDFs + homeworks.
- **xv6 book (MIT)** (free PDF) — https://pdos.csail.mit.edu/6.828/2025/xv6/book-riscv-rev5.pdf —
  a real teaching kernel, read alongside the source (https://github.com/mit-pdos/xv6-riscv).
- **The Little Book of Semaphores** (free, Downey) — https://greenteapress.com/wp/semaphores/ —
  synchronization patterns; readers-writers, producer-consumer, dining philosophers (M7).
- **Writing an OS in Rust** (free) — https://os.phil-opp.com/ — modern OS internals (optional/deep).

## Networking — Module M10
- **Computer Networks: A Systems Approach** (free, Peterson & Davie) —
  https://book.systemsapproach.org/ — TCP/IP, congestion control, end-to-end design.
- **Beej's Guide to Network Programming** (free) — https://beej.us/guide/bgnet/html/ — the socket
  API in C, hands-on.

## Databases & storage engines — Module M11
- **Let's Build a Simple Database** (free, cstack) — https://cstack.github.io/db_tutorial/ — build a
  SQLite-like DB in C (B-tree, pager).
- **Designing Data-Intensive Applications** (paid; topic map only) — storage engines, replication,
  consistency (chapter list as a checklist).
- **Database Internals** (paid; topic map only) — B-trees vs LSM, WAL, MVCC.

## Concurrency deep-dive — Module M7
- **The Little Book of Semaphores** (above) — the classic synchronization problem set.
- **1024cores / lock-free articles** (Dmitry Vyukov) — https://www.1024cores.net/ — lock-free/wait-
  free, memory models, the MPSC queue design used in HastOS.
- **Preshing on Programming** — https://preshing.com/ — memory ordering, atomics, acquire/release.

## Interview problem banks (implementation-style)
- CS:APP labs (DataLab bit puzzles, MallocLab allocator) — inspiration for M1/M6 problems.
- OSTEP homeworks (scheduling, paging, concurrency sims) — inspiration for M6/M7/M8 problems.
- The Little Book of Semaphores problem set — inspiration for M7 concurrency problems.

## Coverage checklist (expansion targets)
Each module should reach ~2.5–4x its initial size. Track per-module additions below as we mine the
sources; a section is "done for this pass" when it has meaningfully more lessons AND practice
problems than the initial version.

| Module | Primary sources |
| --- | --- |
| M0 Orientation & C | Dive Into Systems ch.1–2, Beej's C |
| M1 Data | Dive Into Systems ch.4, CS:APP ch.2 (DataLab) |
| M2 Machine x86-64 | Dive Into Systems ch.7–8, PGU, CS:APP ch.3 |
| M3 Performance/Caches | Dive Into Systems ch.11, CS:APP ch.5–6 |
| M4 Linking | CS:APP ch.7 |
| M5 ECF/Processes | OSTEP (processes, API), xv6 book |
| M6 VM/Allocators | OSTEP (VM), CS:APP ch.9 (MallocLab) |
| M7 Concurrency | OSTEP (concurrency), Little Book of Semaphores, 1024cores, Preshing |
| M8 Scheduling | OSTEP (scheduling: intro, MLFQ, lottery) |
| M9 File Systems | OSTEP (persistence), xv6 book |
| M10 Networking | Computer Networks: A Systems Approach, Beej's bgnet |
| M11 Storage Engines | Let's Build a Simple Database, DDIA/Database Internals topic maps |
