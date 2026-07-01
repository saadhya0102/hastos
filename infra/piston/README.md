# Piston grader for HastOS

Piston is the **primary** code-execution backend ("grader") for HastOS. It runs
learner code in a sandbox and returns stdout/stderr, which the Worker parses into
per-test verdicts. It's free, self-hostable, and light enough to run on a spare
PC or a free-tier VM that's always on.

The HastOS Cloudflare Worker talks to Piston over HTTP. Because the Worker runs
on Cloudflare's edge, your Piston box must be reachable from the internet — the
easiest safe way is a **Cloudflare Tunnel** (no open ports, no public IP needed).

---

## 1. Run Piston

Requires Docker.

```bash
cd infra/piston
docker compose up -d
./install-packages.sh          # one-time: installs C, C++, Rust, Go, NASM, Python
```

Piston now listens on `http://localhost:2000`. Verify:

```bash
curl http://localhost:2000/api/v2/runtimes
```

> Windows: run the Docker commands in WSL2 or Docker Desktop, and run
> `install-packages.sh` from a bash shell (Git Bash / WSL). Piston needs a Linux
> container host.

## 2. Expose it with a Cloudflare Tunnel

Install `cloudflared`, then:

```bash
cloudflared tunnel login
cloudflared tunnel create hastos-piston
# Map a hostname to the local Piston port:
cloudflared tunnel route dns hastos-piston piston.<your-domain>
cloudflared tunnel run --url http://localhost:2000 hastos-piston
```

Quick test without a domain (ephemeral URL):

```bash
cloudflared tunnel --url http://localhost:2000
```

This prints a `https://<random>.trycloudflare.com` URL you can use as
`PISTON_URL` for testing.

## 3. Point the Worker at Piston

```bash
cd ../../workers/gateway
wrangler secret put PISTON_URL      # e.g. https://piston.<your-domain>
wrangler deploy
```

`EXEC_BACKEND` defaults to `auto`, which prefers Piston whenever `PISTON_URL`
is set. Force a backend with `EXEC_BACKEND = "piston" | "judge0"` in
`wrangler.toml`.

## 4. Check grader status

- API: `GET https://<your-worker>/grader-status` →
  `{ "online": true, "backend": "piston", "capabilities": {...} }`
- UI: the **Grader** pill in the top bar turns green ("Grader: Piston") when
  Piston is reachable, amber ("Grader: offline") when it isn't.

---

## Capabilities & limitations (why some things are "banned" offline)

Piston runs **fixed per-language compile scripts**, so the Worker cannot inject
compiler flags. Practical implications:

| Feature                         | Piston | Judge0 | WASM (browser) |
| ------------------------------- | :----: | :----: | :------------: |
| C / C++ / Rust / Go / NASM      |   ✅   |   ✅   |       ❌       |
| Python                          |   ✅   |   ✅   |   ✅ (Pyodide) |
| Correctness grading (stdout)    |   ✅   |   ✅   |       —        |
| Sanitizers (ASan/UBSan/TSan)    |   ❌   |   ✅   |       ❌       |
| Threads (pthreads)              |  ✅*   |   ✅   |       ❌       |
| Raw syscalls / files / network  |   ✅   |   ✅   |       ❌       |

\* On modern glibc (2.34+) pthread symbols are in libc, so most concurrency
problems link and run on Piston; ThreadSanitizer **race detection** is not
available (that needs Judge0 or a VPS with custom flags).

**When the grader is offline**, HastOS falls back to in-browser WASM, which today
supports **Python only**. The UI disables C/C++/Rust/Go/ASM runs and graded
submissions with a clear note until the grader is back online. When Piston is
online, everything routes to Piston (no WASM fallback, no restrictions).
