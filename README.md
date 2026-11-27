# Khabri

Mobile-first notice watcher for Indian exam portals, recruitment boards, scholarships, schemes, and university notice boards.

## Structure
- `mobile/` — Expo (React Native, JS/JSX, Expo Router under `src/app/`, features under `src/features/`)
- `backend/` — Node/Express API (ESM JS) structured as layered MVC (`routes/`, `controllers/`, `services/`, `validators/`, `models/`) + `engine/`, `ai/`, `security/`, `integrations/`, `data/`
- `docs/` — API notes and operational runbook
- `.github/workflows/` — CI and scheduled tick

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
