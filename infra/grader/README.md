# HastOS bundled grader image

One Docker image that **is** the grading server: Piston (code execution) + all
language packs + a Cloudflare tunnel + an agent that **self-registers** with the
HastOS worker. An admin can bring grading online from any amd64 machine with a
single `docker run`, with no redeploy — the website routes to whatever host is
currently registered.

```
[ host machine ]                         [ Cloudflare ]            [ learner ]
docker run hastos-grader                     Worker  <── /execute ── browser
  ├─ Piston API (localhost:2000)               │
  ├─ cloudflared quick tunnel  ────────────────┘  (routes to the
  └─ agent: POST /grader/register + heartbeat      registered tunnel URL)
```

## One-time owner setup

1. **Pick a grader token** (any long random string) and set it on the worker:
   ```bash
   cd workers/gateway
   wrangler secret put GRADER_TOKEN     # paste the random string
   wrangler deploy
   ```
   `ADMIN_EMAILS` (default `saadhya0102@gmail.com`) and `GRADER_IMAGE`
   (default `ghcr.io/saadhya0102/hastos-grader:latest`) are vars in `wrangler.toml`.

2. **Build & push the image** (needs `docker login ghcr.io` with a PAT that has
   `write:packages`):
   ```bash
   bash infra/grader/build-and-push.sh
   ```
   Then make the GHCR package **public** (GitHub → your profile → Packages →
   `hastos-grader` → Package settings → Change visibility → Public) so hosts can
   pull without logging in.

## Bringing a grader online (any admin machine)

1. Install Docker (Windows/macOS: Docker Desktop; Linux: `docker`). **amd64 only.**
2. Sign in to HastOS as the admin account, open **Admin → Grader hosting**, and
   click **Copy** on the shown command. It looks like:
   ```bash
   docker run -d --name hastos-grader --restart unless-stopped \
     --privileged --memory=2g --cpus=2 --pids-limit=1024 \
     --tmpfs /tmp:exec --tmpfs /piston/jobs:exec,uid=1000,gid=1000,mode=711 \
     -v hastos_piston_packages:/piston/packages \
     -e WORKER_URL=https://<your-worker> \
     -e GRADER_TOKEN=<token> \
     -e GRADER_NAME="$(hostname)" \
     ghcr.io/saadhya0102/hastos-grader:latest
   ```
3. Paste it into a terminal. First run pulls the image and installs languages
   (cached afterward). Within ~30s the **Grader** pill turns green.

To stop / go offline: `docker rm -f hastos-grader`.
Logs: `docker logs -f hastos-grader`.

## Safety / resource limits

- The whole grader is capped at **2 GB RAM / 2 CPUs / 1024 pids** (`docker run`
  flags) — it can never exhaust the host. Each submission also has per-run CPU,
  wall-clock and memory limits.
- Submitted code runs in Piston's **isolate** sandbox (namespaces, chroot,
  unprivileged users, cgroups) with no network.
- The Piston container needs `--privileged` for its sandbox. That's standard, but
  for maximum isolation run it on a throwaway VM rather than your main machine.

## Notes / limits

- **amd64 required** (Piston language packs are amd64; ARM won't work).
- Piston can't inject compiler flags → no ASan/UBSan/TSan. Concurrency problems
  are graded by re-running the harness 10× and failing if any run trips an
  invariant (see `workers/gateway/src/routes/execute.ts`).
- The quick-tunnel URL rotates each container start; that's fine — the agent
  re-registers the new URL automatically. For a fixed hostname, adapt the agent
  to a named tunnel.
- A registered grader **overrides** the static `PISTON_URL` secret while it's
  alive; if it dies, its record expires (~120s) and the pill goes offline.
