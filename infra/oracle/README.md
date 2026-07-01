# HastOS code execution on Oracle Cloud "Always Free"

This sets up a free, self-hosted **Judge0** that the Cloudflare Worker calls for Run/Submit.

## Pick the right instance shape

Oracle's Always Free tier has two options:

- **Ampere A1 (ARM / aarch64)** — up to **4 OCPUs + 24 GB RAM**. This is the one to use:
  enough RAM for the Judge0 stack and compilers.
- AMD E2.1.Micro (x86) — 1/8 OCPU, **1 GB RAM**. Too small for the Judge0 + Postgres + Redis
  stack; not recommended.

> ARM caveat: official Judge0 images are x86-only. On ARM we use the community **aarch64**
> image (`mechaadi/judge0:1.0.0-aarch64`) via `infra/judge0/docker-compose.arm64.yml`. It
> supports C, C++, Rust, Go, and Python (everything HastOS grades today) but **not** nasm
> assembly. For the future assembly problems (Module M2), either build Judge0 for arm64 from
> source, or run the official x86   image (`docker-compose.yml`) on an x86 host.

## Step-by-step

### 1. Create the instance
- OCI Console → Compute → Instances → Create.
- Shape: **VM.Standard.A1.Flex**, 4 OCPU / 24 GB (or smaller).
- Image: **Ubuntu 22.04** (or Oracle Linux 8).
- Add your SSH public key; assign a public IPv4.

### 2. Open the firewall (two layers)
- **OCI Security List**: Networking → your VCN → Security Lists → Default → add an
  **Ingress rule**: source `0.0.0.0/0` (or, better, Cloudflare egress ranges), IP protocol
  TCP, destination port **2358**.
- **Host firewall**: handled by `setup.sh` (adds an iptables ACCEPT for 2358).

### 3. Bootstrap the box
SSH in, then:
```bash
git clone https://github.com/saadhya0102/hastos.git
cd hastos/infra/oracle
bash setup.sh           # installs Docker, enables cgroup v1, opens port 2358
sudo reboot             # required so cgroup v1 takes effect
```

### 4. Configure secrets and start Judge0
```bash
cd hastos/infra/judge0
cp ../oracle/judge0.conf.example judge0.conf
nano judge0.conf        # set strong POSTGRES_PASSWORD, REDIS_PASSWORD, AUTHN_TOKEN
cd ../oracle
bash setup.sh --run     # starts Judge0 and prints /languages
```
You should see a JSON list of languages. Note the **C** language id (CE default is `50`); if
it differs, update `packages/shared/languages.ts` and the `LANG_ID` map in
`workers/gateway/src/routes/execute.ts`, plus the `languageId` fields in
`workers/gateway/src/lib/problems.ts`.

### 5. Point the Worker at it
From your machine (or set as GitHub secrets for CI):
```powershell
cd workers/gateway
npx wrangler secret put JUDGE0_URL          # http://<your-oracle-public-ip>:2358
npx wrangler secret put JUDGE0_AUTH_TOKEN    # the AUTHN_TOKEN from judge0.conf
```
Setting secrets auto-redeploys the Worker. Now Run/Submit work end-to-end on
https://hastos.web.app.

### 6. Verify
```bash
# On the box (local):
curl -s -H "X-Auth-Token: <AUTHN_TOKEN>" http://localhost:2358/about
# From anywhere (after ingress rule):
curl -s http://<public-ip>:2358/languages | head
```

## Security notes
- Keep `ENABLE_NETWORK=false` (no network inside the sandbox).
- The Worker is the only intended caller and always sends `X-Auth-Token`; ideally restrict the
  OCI ingress to Cloudflare ranges so the engine isn't open to the world.
- Conservative CPU/wall/memory/process limits are set in `judge0.conf`.
- Never commit `judge0.conf` (it holds secrets) — it is gitignored.

## Hardening / scaling later
- Put a TLS reverse proxy (Caddy/nginx) in front and use `https://` for `JUDGE0_URL`.
- Add more worker threads (`COUNT` in judge0.conf) up to your core count.
- To scale beyond the free box, add worker-only nodes pointing at the same Postgres/Redis.
