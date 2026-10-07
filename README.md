# Evil-Stack-Engine

A multi-agent task orchestration dashboard prototype: an Express API with a simulated multi-agent task engine, plus a React dashboard showing task queues, agent status, and engine telemetry. Built as a Replit export (pnpm workspace stack).

Important: the "agents" (`claude`, `deepseek`, `hermes`) are **simulated in-process** — the engine assigns tasks to an agent, waits a random delay based on priority, then completes or fails the task randomly with generated result text. No model APIs are called.

## Features

- **Simulated task engine** (`artifacts/api-server/src/lib/engine.ts`) — in-memory queue; tasks move queued → processing → completed/failed/cancelled; agents track status, tasks processed, and average latency; rolling log buffer.
- **Task API** — `GET /tasks`, `POST /tasks`, `GET /tasks/:id`, `DELETE /tasks/:id`.
- **Agent API** — `GET /agents` (agent roster and status).
- **Telemetry** — `GET /telemetry/snapshot` (CPU, memory, uptime, requests/sec) and `GET /logs/stream` (SSE log stream).
- **Health** — `GET /healthz`; `GET /stats/summary` (task counts by status).
- **Dashboard** — React pages for overview, tasks, and agents with live polling and dark theme.
- **API contracts** — OpenAPI 3.1 spec (`lib/api-spec/openapi.yaml`) as source of truth; Zod schemas (`lib/api-zod`) and React Query client (`lib/api-client-react`) generated via Orval.
- **Database package** — Drizzle ORM Postgres schema scaffold (`lib/db`); requires `DATABASE_URL`.

## Tech stack

- pnpm workspaces, Node.js 24, TypeScript 5.9.
- API: Express 5, pino logging, CORS, Zod v4 validation, esbuild build.
- DB: PostgreSQL + Drizzle ORM (schema package only).
- Frontend: React, Vite, Wouter, TanStack Query, shadcn/ui.

## Getting started

Per `replit.md` (run/stack sections filled; product and architecture sections are template stubs):

```bash
pnpm install
pnpm --filter @workspace/api-server run dev     # API server (port 5000)
pnpm run typecheck                               # full typecheck across packages
pnpm run build                                   # typecheck + build all packages
pnpm --filter @workspace/api-spec run codegen   # regenerate API hooks + Zod from openapi.yaml
pnpm --filter @workspace/db run push            # push DB schema (dev only)
```

Required env: `DATABASE_URL` (Postgres connection string).

## Project structure

```
├── artifacts/
│   ├── api-server/      # Express API + simulated engine (src/lib/engine.ts,
│   │                    # routes: tasks, agents, stats, telemetry, health)
│   ├── dashboard/       # React dashboard (pages: dashboard, tasks, agents)
│   └── mockup-sandbox/  # UI mockup sandbox
├── lib/
│   ├── api-spec/        # openapi.yaml — API source of truth
│   ├── api-client-react/# Orval-generated React Query hooks
│   ├── api-zod/         # Orval-generated Zod schemas
│   └── db/              # Drizzle schema + config
├── scripts/             # helper scripts (post-merge)
└── replit.md            # run commands; product/architecture sections are stubs
```

## Status

**Early-stage scaffold / simulation.** The engine, API, and dashboard are wired together, but task execution is fake (simulated delays and random outcomes) and the product documentation is unfilled template text. Exported from https://replit.com/@isitlocated/Evil-Stack-Engine.
