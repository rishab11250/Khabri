# Khabri

Mobile-first notice watcher for Indian exam portals, recruitment boards, scholarships, schemes, and university notice boards.

## Structure
- `mobile/` — Expo (React Native, JS/JSX, Expo Router under `src/app/`, features under `src/features/`)
- `backend/` — Node/Express API (ESM JS) structured as layered MVC (`routes/`, `controllers/`, `services/`, `validators/`, `models/`) + `engine/`, `ai/`, `security/`, `integrations/`, `data/`
- `docs/` — Project documentation:
  - [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — System design, pipeline, security guardrails, and failover flows
  - [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) — Code style, MVC boundaries, theming, i18n, and JSDoc rules
  - [`docs/api.md`](docs/api.md) — REST endpoints, auth gates, and quotas
  - [`docs/runbook.md`](docs/runbook.md) — Local setup, env vars, CI, and operational playbooks
  - [`docs/sources.md`](docs/sources.md) — Verified catalog portals and robots/crawl notes
- `.github/workflows/` — CI (`ci.yml`) and 15-minute scheduled tick (`tick.yml`)

## Commands
### Backend
```sh
cd backend
pnpm install
pnpm dev
pnpm lint
pnpm format:check
pnpm test
```

### Mobile
```sh
cd mobile
pnpm install
pnpm start
pnpm lint
pnpm format:check
```
