# Khabri Runbook

## 1. Required Accounts & Environment Variables (Backend Phase 0)
Create a Supabase project, MongoDB Atlas free-tier cluster, and Render Web Service (root directory: `backend`, build: `pnpm install --frozen-lockfile`, start: `pnpm start`):

- `PORT` (`4000`, Render sets automatically)
- `NODE_ENV` (`production`)
- `MONGODB_URI` — MongoDB Atlas connection string
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_JWT_SECRET` — Supabase JWT secret (if HS256; or `SUPABASE_JWKS_URL` for asymmetric signing keys)
- `SUPABASE_SERVICE_ROLE_KEY` — needed for `DELETE /v1/me` Supabase Auth deletion & Storage
- `INTERNAL_TICK_SECRET` — random >=8-char secret shared with GitHub Actions `tick.yml`

## 2. GitHub Actions Secrets (`tick.yml`)
Add repository secrets:
- `API_URL` — deployed Render base URL (no trailing slash)
- `INTERNAL_TICK_SECRET` — matches backend `INTERNAL_TICK_SECRET`
