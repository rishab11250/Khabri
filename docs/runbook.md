# Khabri Operations Runbook

## 1. Local Development Setup

### Prerequisites
- Node.js 22+ and `pnpm` (`corepack enable` or `npm i -g pnpm`).
- MongoDB Atlas URI (or local `mongod`) and a Supabase project.

### Backend (`Khabri/backend`)
```sh
cd backend
cp .env.example .env   # Populate required secrets
pnpm install
pnpm seed              # Upsert verified catalog sources + demo notice board
pnpm dev               # Start Express with --watch on PORT (default 4000)
```
Verification commands:
```sh
pnpm lint              # ESLint (0 errors required)
pnpm format:check      # Prettier formatting check
pnpm test              # Vitest suite (uses mongodb-memory-server)
```

### Mobile (`Khabri/mobile`)
```sh
cd mobile
cp .env.example .env   # Set EXPO_PUBLIC_API_URL, EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
pnpm install
pnpm start             # Start Expo bundler (or pnpm android / ios / web)
```
Verification commands:
```sh
pnpm lint
pnpm format:check
npx expo export --platform android --clear
```

## 2. Environment Variables & Production Provisioning

### Backend (`Render` Web Service)
Deploy root `backend/` with build command `pnpm install --frozen-lockfile` and start command `pnpm start`.

- `PORT` — HTTP bind port (`4000` locally; injected automatically by Render).
- `NODE_ENV` — `production` in deployed environments.
- `CORS_ORIGIN` — Optional allowed browser origin(s); leave unset when only native Expo clients connect.
- `MONGODB_URI` **(required, secret)** — MongoDB Atlas connection URI.
- `SUPABASE_URL` **(required)** — Supabase project HTTPS URL.
- `SUPABASE_JWT_SECRET` **(optional, secret)** — Legacy HS256 JWT secret.
- `SUPABASE_JWKS_URL` **(optional)** — Explicit JWKS URI (defaults to `<SUPABASE_URL>/auth/v1/.well-known/jwks.json`).
- `SUPABASE_SERVICE_ROLE_KEY` **(optional, highly secret)** — Needed only so `DELETE /v1/me` deletes the Supabase Auth account.
- `INTERNAL_TICK_SECRET` **(required, min 8 chars, secret)** — Shared secret validated via `x-tick-secret` on `/internal/*`.
- `GEMINI_API_KEY_1` / `GEMINI_API_KEY_2` / `GEMINI_MODEL` **(optional, secret)** — Primary/secondary Gemini keys and model name.
- `GROQ_API_KEY_1` / `GROQ_API_KEY_2` / `GROQ_MODEL` **(optional, secret)** — Fallback Groq credentials.
- `AI_DAILY_LIMIT_PER_KEY` **(optional)** — Daily call cap per AI key (`0` disables quota tracking).
- `SERPAPI_KEY_1` / `SERPAPI_KEY_2` / `SERPAPI_MONTHLY_LIMIT_PER_KEY` **(optional, secret)** — Web search fallback keys and monthly cap (switches at 90%, halts at 95%).
- `EXPO_ACCESS_TOKEN` **(optional, secret)** — Authenticated Expo Push API delivery token.
- `DEMO_MODE` **(optional, default `false`)** — Enables mutating `/demo/board` via `POST /demo/board`.

### GitHub Actions (`tick.yml` & `ci.yml`)
`tick.yml` triggers `POST $API_URL/internal/tick` every 15 minutes (`*/15 * * * *`) using repository secrets:
- `API_URL` — Deployed Render base URL without trailing slash.
- `INTERNAL_TICK_SECRET` — Matches backend `INTERNAL_TICK_SECRET`.

### Mobile (`.env` / EAS Build)
- `EXPO_PUBLIC_API_URL` — Deployed backend base URL (no trailing slash).
- `EXPO_PUBLIC_SUPABASE_URL` — Public Supabase URL.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Public publishable anon key (safe to bundle; never use `SERVICE_ROLE_KEY`).

## 3. Incident & Operational Playbooks

### Scheduled Tick Failures (`tick.yml` alerts)
- `curl --fail-with-body` fails on HTTP `4xx`/`5xx`. Check Render logs for `INTERNAL_TICK_SECRET` mismatch (`401`), expired Atlas IP allowlist (`503`), or unhandled lock contention.
- If a worker crashes mid-tick without releasing `JobLock('tick')`, its 10-minute lease expires automatically before subsequent ticks run.

### Source Stops Updating (`circuitOpenUntil` or `unsupported`)
- `5` consecutive fetch/parse failures open a 6-hour circuit (`circuitOpenUntil`) on that `Source`. Transient government portal outages recover automatically after expiry.
- Portals switching to client-side JS shells get flagged `unsupported: true`; users can replace them with search-watch fallback if `SERPAPI_KEY_*` is provisioned.

### AI / SerpAPI Quota Exhaustion
- On Gemini `429`, the router triggers a 60-second cooldown and fails over cleanly (`geminiA <-> geminiB -> groqA <-> groqB`), falling back to deterministic rule-based summaries (`buildRulesOnlyAnalysis`) when all providers are exhausted or disabled.
- SerpAPI stops search calls at 95% of `SERPAPI_MONTHLY_LIMIT_PER_KEY` (`SearchCache` continues serving cached 6-hour results).

### Invalid Push Tokens
- Expo `DeviceNotRegistered` push receipts trigger automatic deletion of stale `Device` documents during push receipt processing.
