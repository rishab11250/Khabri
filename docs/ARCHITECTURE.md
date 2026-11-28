# Khabri System Architecture

Khabri is a notice-monitoring platform that tracks Indian exam portals, recruitment boards, scholarships, government schemes, and university notice pages, detects material changes, explains impacts in plain language (`en` / `hi` / `gu`), and tracks deadlines.

## 1. High-Level Stack & Workspace Split

- **Mobile Client (`mobile/`):** Expo 58 / React Native 0.88 app using Expo Router, React Query, Zustand, i18next, React Hook Form + Zod, and Expo native modules (Notifications, Camera, ImagePicker, Location, Contacts, Calendar, Print, Sharing, ViewShot, Share Intent).
- **Backend API (`backend/`):** Express 5 REST service running on Node 22 with MongoDB (Mongoose), Supabase Auth JWT verification (`jose`), structured Pino logging, and background crawl/digest endpoints triggered via GitHub Actions cron (`tick.yml`).
- **External Integrations:**
  - **Supabase Auth:** Mobile authentication (`@supabase/supabase-js`) and backend JWKS/HS256 verification + `DELETE /v1/me` user deletion.
  - **Google Gemini (`@google/genai`) & xAI Grok:** AI summarization, photo circular scanning, Ask Khabri grounded Q&A, and Samjhao translations.
  - **SerpAPI (`integrations/serpapi.js`):** Search-watch fallback when a site blocks direct fetching or relies on client-side JS rendering (`unsupported: true`).
  - **Expo Push Service (`integrations/expoPush.js`):** Batched push notification delivery and ticket receipt cleanup.

## 2. Backend Layering & Request Lifecycle

1. **HTTP Security & Parsing (`src/app.js`):** Applies `helmet`, configurable `cors`, JSON/URL-encoded body parsers, and `pino-http` request logging with credential redaction.
2. **Routing (`src/routes/`):**
   - Public: `/health`, `/auth/confirmed`, `/v1/catalog/*`.
   - Internal cron: `/internal/tick` and `/internal/digest` (protected by `x-tick-secret` header).
   - Authenticated (`/v1/*`): Guarded by `requireAuth` (`middleware/auth.js`), validating Supabase Bearer JWTs and resolving the `User` record.
   - Demo: `/demo/board` (`GET` public HTML board; `POST` gated by `DEMO_MODE=true`).
3. **Validation & Controllers (`src/validators/`, `src/controllers/`):** Zod schemas validate request inputs before controllers delegate to `src/services/`. Errors bubble via Express 5 promise forwarding into `middleware/errors.js`, normalizing `AppError`, Zod errors, Mongoose validation/cast/duplicate-key errors, and unknown 500s into the standard `{ success, data, error }` envelope.

## 3. Change-Detection Pipeline (`src/engine/`)

Triggered every 15 minutes by `.github/workflows/tick.yml` (`POST /internal/tick`) or manually per watch (`POST /v1/watches/:id/refresh` with 1-hour cooldown):

1. **Distributed Lock (`scheduler.js`):** `acquireJobLock('tick', 10m)` prevents overlapping ticks using MongoDB conditional upsert on `JobLock`.
2. **Due Source Selection:** `selectDueSources` prioritizes sources with active watches (`followerCount > 0`), ordered by nearest active `Deadline`, `followerCount`, and `nextDueAt`, skipping sources whose 6-hour circuit breaker (`circuitOpenUntil`) is still open.
3. **Polite & SSRF-Guarded Fetching (`security/`, `engine/fetchers/`):**
   - `assertRobotsAllowed` checks `robots.txt` (1-hour in-memory cache) and respects `crawlDelay` (clamped 1–10s).
   - `waitForHostSlot` serializes requests per hostname.
   - `safeFetch` validates URL protocol/credentials/IP ranges before every hop (max 3 redirects), strips credentials, resolves DNS explicitly to block private/loopback/link-local CIDRs, pins a 8s timeout, enforces a 3MB body limit and allowed MIME types, and sends `If-None-Match` / `If-Modified-Since`.
4. **Extraction & Diffing (`extract.js`, `normalise.js`, `diff.js`, `pdfExtract.js`):**
   - Unchanged `304` responses or unrenderable SPA shells (`unsupported: true`) stop early.
   - First crawl records a baseline `Snapshot`.
   - Subsequent crawls run `diffListings` (protected by a displacement guard when `prevItems >= 5` and `added > 0`) or `diffPages` (`diffSentences`). If a notice links to a PDF, `fetchAndExtractPdf` extracts text from up to 5MB / first 5 pages.
5. **Materiality Filter (`materialFilter.js`):** Suppresses trivial whitespace or sub-25-character noise unless material signals (`extractSignals`: dates, numeric thresholds, eligibility/admit/result keywords) changed. Saves snapshots and retains the latest 10 (`pruneSnapshots(10)`).
6. **AI Analysis & Deterministic Trust (`ai/analyzeChange.js`, `ai/trust.js`):**
   - Checks `AiCache` (30-day TTL by content hash + language).
   - Calls AI router (`analyzeChangeWithRouter`), validating output against `changeAnalysisSchema` and `hasDisallowedUrls` (up to 2 attempts), falling back deterministically to `buildRulesOnlyAnalysis` if AI fails or quota is exhausted.
   - `resolveTrustTag` assigns trust labels deterministically from domain suffixes and flags—never trusting LLM classification.
7. **Follower Fan-Out & Deadlines (`engine/deadlines.js`):** Creates `Change` and `Deadline` records (recording `previousDueAt` when dates shift) and initial user checklists.
8. **Failure Circuit:** Repeated crawl errors increment `Source.failures`; reaching threshold 5 opens a 6-hour `circuitOpenUntil` window.

## 4. Security Guardrails (`src/security/`, `src/ai/prompts.js`)

- **SSRF Protection (`ssrfGuard.js`):** Rejects non-HTTP(S) schemes, URLs embedding `username:password`, localhost/internal hostnames, and IPv4/IPv6 private, loopback, link-local, or IPv4-mapped IPv6 addresses across DNS resolution and redirects.
- **Prompt-Injection Isolation (`ai/prompts.js`):** External HTML/PDF content is wrapped in explicit delimiters with system instructions treating fetched text strictly as untrusted data, alongside URL allowlist validation on model outputs (`hasDisallowedUrls`).
- **Rate Limits & Quotas:** Express rate limiting protects public and mutation routes; user daily AI caps (`USER_DAILY_CAPS`: `photo: 5`, `ask: 10`) and watch limits (`15` total, `3` search watches) enforce multi-tenant fairness.

## 5. AI Router & SerpAPI Failover

- **AI Router (`ai/router.js`):** Maintains provider chains ordered by traffic class:
  - Background ticks: `geminiA -> geminiB -> grok` (`vision`: `geminiA -> geminiB`).
  - Interactive user requests: `geminiB -> geminiA -> grok` (`vision`: `geminiB -> geminiA`).
  - HTTP `429` puts a key into a `60s` cooldown (`cooldownMs`); 3 consecutive non-429 errors open a `5m` circuit (`circuitMs`). Atomic `$inc` counters on `Quota` enforce `AI_DAILY_LIMIT_PER_KEY`.
- **SerpAPI (`integrations/serpapi.js`):** Caches search results for 6 hours (`SearchCache`), fails over from `SERPAPI_KEY_1` to `SERPAPI_KEY_2` at 90% key-1 usage, and hard-stops at 95% total monthly budget (`SERPAPI_MONTHLY_LIMIT_PER_KEY`).

## 6. Notifications, Digest & Offline Mobile Architecture

- **Notification Dispatcher (`engine/dispatcher.js`, `digest.js`):**
  - Respects user quiet hours (`22:00`–`07:00` IST default) while permitting urgent deadlines within 24 hours (`bypassUrgent`).
  - Collapses burst notifications per source within a 10-minute window and queues non-instant alerts for scheduled `POST /internal/digest` runs.
  - Cleans up invalid push tokens when Expo returns `DeviceNotRegistered` receipts.
- **Mobile Offline & Deep Links (`mobile/src/lib/`, `components/AppProviders.jsx`):**
  - Stores JWTs in `expo-secure-store`, caches feed/catalog/watch/deadline snapshots on device storage (`fileCache.js`), queues read/checklist mutations while offline (`offlineQueue.js`) until `useOnline` reconnects, and handles share intents (`expo-share-intent`) and deep links (`khabri://change/:id`).
