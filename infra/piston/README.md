# Piston grader for HastOS (self-hosted)

Piston is the **primary** code-execution backend ("grader") for HastOS. It runs
learner code in a sandbox and returns stdout/stderr, which the Worker parses into
per-test verdicts.

> **The public Piston API (`emkc.org`) is no longer free.** As of 2026-02-15 it
> requires an authorization token, and keys are **not** granted for individual,
> educational, portfolio, or "project" use. So HastOS must run its **own** Piston
> instance. It's free and open source — you just need a host to run it on.

## What kind of host do I need?

Piston requires:

- **Linux** — it sandboxes with Linux namespaces + cgroups (via Isolate).
- **x86-64 (amd64)** — Piston's prebuilt language packages are amd64. ARM (e.g.
  Oracle's Ampere free tier) is **not** recommended: packages won't install
  cleanly, same caveat we hit with Judge0. Use an amd64 host.
- **Docker**, and enough RAM to compile (≈1 GB works for the small programs here;
  2 GB is comfortable).

Two good free options:

| Option | Notes |
| ------ | ----- |
| **Your always-on Windows PC via WSL2 + Docker** | Free, x86-64 (matches Piston packages). Needs a one-time WSL install (admin + reboot). Expose to the internet with a Cloudflare Tunnel. See below. |
| **A small amd64 Linux VM** | e.g. Oracle Cloud's *AMD* micro free tier (x86, ~1 GB), or any cheap VPS. Has a public IP; put it behind a tunnel or TLS reverse proxy. |

---

## Path A — This PC (Windows) via WSL2 + Docker

One-time (run **PowerShell as Administrator**, then reboot when asked):

```powershell
wsl --install -d Ubuntu
```

After reboot, open the **Ubuntu** terminal and run:

```bash
# Install Docker inside WSL, run Piston, install language packs — one shot:
curl -fsSL https://raw.githubusercontent.com/saadhya0102/hastos/main/infra/piston/setup-linux.sh | bash
# (or, from the repo checkout:)  bash infra/piston/setup-linux.sh
```

Verify: `curl http://localhost:2000/api/v2/runtimes`

Then expose it (see **Expose with a Cloudflare Tunnel** below). Keep the Ubuntu
terminal / tunnel running (or install them as services) so it stays always-on.

## Path B — An amd64 Linux VM

SSH into a fresh Ubuntu/Debian **amd64** box and run:

```bash
bash infra/piston/setup-linux.sh          # installs Docker + Piston + packages
```

Or manually with the compose file in this folder:

```bash
docker compose up -d
./install-packages.sh
```

---

## Expose with a Cloudflare Tunnel (this is where your PISTON_URL comes from)

The HastOS Worker runs on Cloudflare's edge, so it **cannot** reach
`localhost:2000` — Piston must have a public HTTPS address. A Cloudflare Tunnel
gives you one without opening any ports.

Install `cloudflared`, then:

```bash
# Quick, ephemeral URL (great for testing — no domain needed):
cloudflared tunnel --url http://localhost:2000
```

This prints something like:

```
+---------------------------------------------------------+
|  https://tidy-brook-1234.trycloudflare.com              |
+---------------------------------------------------------+
```

**That printed `https://...trycloudflare.com` URL is your `PISTON_URL`.** (It
changes each run. For a stable URL, create a named tunnel bound to your own
domain:)

```bash
cloudflared tunnel login
cloudflared tunnel create hastos-piston
cloudflared tunnel route dns hastos-piston piston.<your-domain>
cloudflared tunnel run --url http://localhost:2000 hastos-piston
# -> PISTON_URL = https://piston.<your-domain>
```

## Point the Worker at it

```bash
cd workers/gateway
wrangler secret put PISTON_URL      # paste the tunnel URL (or http://localhost:2000 for `wrangler dev`)
wrangler deploy
```

`EXEC_BACKEND` defaults to `auto`, which prefers Piston whenever `PISTON_URL` is
set. The URL can be the tunnel root, `.../api/v2`, or `.../api/v2/execute` — the
adapter normalizes it.

## Check grader status

- API: `GET https://<your-worker>/grader-status` → `{ "online": true, "backend": "piston", ... }`
- UI: the **Grader** pill in the top bar turns green ("Grader: Piston").

---

## Where do I find the Piston URL? (short answer)

- **Local dev only** (`wrangler dev` on your machine): `http://localhost:2000`.
- **Everything else** (deployed Worker): the **Cloudflare Tunnel URL** you get
  from `cloudflared tunnel --url http://localhost:2000` (ephemeral
  `*.trycloudflare.com`) or your named-tunnel hostname (`piston.<your-domain>`).
- There is **no free public URL** anymore.

## Capabilities & limitations

Piston runs **fixed per-language compile scripts**, so the Worker can't inject
compiler flags:

| Feature                        | Piston | Judge0 | WASM (browser) |
| ------------------------------ | :----: | :----: | :------------: |
| C / C++ / Rust / Go / NASM     |   ✅   |   ✅   |       ❌       |
| Python                         |   ✅   |   ✅   |  ✅ (Pyodide)  |
| Correctness grading (stdout)   |   ✅   |   ✅   |       —        |
| Sanitizers (ASan/UBSan/TSan)   |   ❌   |   ✅   |       ❌       |
| Threads (pthreads)             |  ✅*   |   ✅   |       ❌       |
| Raw syscalls / files / network |   ✅   |   ✅   |       ❌       |

\* On modern glibc (2.34+) pthread symbols live in libc, so most concurrency
problems link and run on Piston; ThreadSanitizer race detection needs Judge0.

When the grader is offline, HastOS falls back to in-browser WASM (**Python
only**); other languages and graded submissions are disabled with a note until
the grader is back. When Piston is online, everything routes to it.
