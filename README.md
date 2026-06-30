# HastOS

Systems-programming education platform with an integrated multi-language IDE, automatic
test-harness grading, a full collegiate systems curriculum, and **SLAVA** — the *Systems
Learning Assistant for Verification and Assessment* (AI tutor).

See [`docs/PRD.md`](docs/PRD.md) for the full product requirements document.

## Monorepo layout

```
hasystor/
├── apps/web/              # Vite + React + TS SPA (hosted on Firebase Hosting)
├── workers/gateway/       # Cloudflare Worker (Hono): /slava, /execute, auth verify
├── packages/
│   ├── shared/            # shared types + Judge0 language config
│   └── content-schema/    # Zod schemas + defineLesson/defineProblem/defineTrivia
├── infra/
│   ├── firebase/          # firestore.rules, firestore.indexes.json
│   └── judge0/            # docker-compose for self-hosting code execution
└── docs/PRD.md
```

> Implementation note: the PRD specifies "Next.js static export". The scaffold uses
> **Vite + React** instead — functionally an equivalent static SPA on Firebase Hosting,
> chosen for a fast, reliable one-shot build. All other architectural decisions match the PRD.

## Prerequisites

- Node.js >= 20 (uses **npm workspaces**; pnpm not required)
- A Firebase project (Auth + Firestore + Hosting)
- A Cloudflare account (Workers) for the secret-handling gateway
- Judge0 (RapidAPI for dev, or self-hosted via `infra/judge0`)

## Quick start

```bash
npm install

# Web app (configure apps/web/.env from .env.example first)
npm run dev

# Worker gateway (configure workers/gateway/.dev.vars first)
npm run dev --workspace @hasystor/gateway

# Production build of the SPA
npm run build:web
```

## Environment / secrets

- **Web** (`apps/web/.env`): only public Firebase client config + the Worker base URL.
  Copy from `apps/web/.env.example`.
- **Worker** (`workers/gateway/.dev.vars` locally; `wrangler secret` in prod): holds all
  secrets — `OPENAI_API_KEY`, `GROQ_API_KEY`, `JUDGE0_URL`, `JUDGE0_AUTH_TOKEN`,
  `FIREBASE_PROJECT_ID`, and the `PRIMARY_AI_ENABLED` toggle. Copy from
  `workers/gateway/.dev.vars.example`. **No secret is ever shipped to the browser.**

## Phase 1 status

- [x] PRD (`docs/PRD.md`)
- [x] App shell (all routes, auth, Firestore wiring, design system, IDE, SLAVA panel)
- [x] Worker gateway (`/health`, `/execute`, `/slava` with OpenAI→Groq fallback)
- [x] One complete lesson (`m1-bit-ops`)
- [x] One graded IDE problem (`ds-ring-buffer`, hidden harness)
- [x] SLAVA wired in lesson + problem contexts
- [ ] Bulk curriculum content (later pass — see PRD §27/§28/§32)
