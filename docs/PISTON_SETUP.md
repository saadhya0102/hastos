# Piston setup — TODO (deferred)

The grader (Piston) isn't running yet. Until it is, HastOS shows **"Grader:
offline"** and runs **Python in-browser (WASM)**; C/C++/Rust/Go/ASM and graded
submissions are disabled with a note. Everything else works.

The code + scripts are already done and committed. This is the operational
checklist to turn it on later. Full detail: `infra/piston/README.md`.

## Constraints (why we can't just use a public API)
- The public Piston API (`emkc.org`) is **no longer free** (auth token required
  since 2026-02-15; keys not granted for projects like this).
- Piston needs **Linux + x86-64** (Isolate sandbox uses Linux namespaces/cgroups;
  language packs are amd64). **ARM (Oracle Ampere) won't work** — use amd64.

## Pick a host
- [ ] **Option A — this always-on Windows PC via WSL2** (x86-64, free), or
- [ ] **Option B — an amd64 Linux VM** (e.g. Oracle *AMD* micro free tier, or a VPS)

## Steps

### A) Windows PC (WSL2)
- [ ] PowerShell **as Administrator**: `wsl --install -d Ubuntu` → reboot
- [ ] Open **Ubuntu**, in the repo: `bash infra/piston/setup-linux.sh`
      (installs Docker + Piston + C/C++/Rust/Go/NASM/Python packs)
- [ ] Verify: `curl http://localhost:2000/api/v2/runtimes`

### B) amd64 Linux VM
- [ ] SSH in (fresh Ubuntu/Debian **amd64**)
- [ ] `bash infra/piston/setup-linux.sh`
- [ ] Verify: `curl http://localhost:2000/api/v2/runtimes`

### Expose it (this produces PISTON_URL)
- [ ] Install `cloudflared`
- [ ] Testing URL: `cloudflared tunnel --url http://localhost:2000`
      → copy the printed `https://<random>.trycloudflare.com` = **PISTON_URL**
- [ ] (Stable) named tunnel bound to a domain → `https://piston.<your-domain>`

### Wire the Worker (my side is ready; this is the wrangler part)
- [ ] `cd workers/gateway`
- [ ] `wrangler secret put PISTON_URL`  (paste the tunnel URL)
- [ ] `wrangler deploy`
- [ ] Confirm the **Grader** pill in the top bar turns green ("Grader: Piston")
      (or hit `GET https://<worker>/grader-status`)

## Keep it running
- [ ] Piston container has `--restart unless-stopped` (survives reboots once the
      Docker daemon starts). For WSL, ensure Docker starts on boot (Docker
      Desktop, or `sudo service docker start`).
- [ ] Run the tunnel as a service (`cloudflared service install`) so the URL
      stays up. A named tunnel keeps a stable hostname across restarts.

## Notes / limitations to remember
- Piston can't inject compiler flags → **no ASan/UBSan/TSan** (sanitizer-based
  race/leak detection). Correctness is still graded via test stdout.
- pthreads generally link on modern glibc (2.34+), so most concurrency problems
  run; race *detection* would need Judge0 or a VPS with custom flags.
- **Concurrency problems are re-run automatically.** On a non-TSan backend
  (Piston), the grader runs each `pthread` harness **10 times** and fails the
  submission if *any* run trips an invariant — a data race that surfaces in even
  one interleaving is caught. It's probabilistic (not a proof like TSan), but
  catches the common cases. On Judge0 the TSan build runs once instead. See
  `workers/gateway/src/routes/execute.ts` (`CONCURRENCY_RUNS`).
- Optional later: add Judge0 as a fallback grader (`wrangler secret put JUDGE0_URL`)
  for sanitizer coverage. `EXEC_BACKEND=auto` already prefers Piston.
