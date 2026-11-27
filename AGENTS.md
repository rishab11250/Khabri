# Khabri — Agent Rules & Project Commands

## 1. Boundaries & Git
- Git root is `Khabri/`. Never edit `../PRD.md` or `../TIMELINE.md`. In `../CHECKLIST.md`, only tick items and append logs.
- Read-only git commands only (`status`, `diff`, `log`, `show`, `branch`, `remote -v`) unless user says `commit` or `push`.
- Never commit `.env*` (except `.env.example`), `node_modules`, `.expo`, `dist`, or secrets.
- Never auto-commit. End each task report with: `Ready to commit. Suggested message: <message>`.

## 2. Locked Stack
- **Language:** JavaScript & JSX only (`.js` / `.jsx`) for both `backend/` and `mobile/` (user override of PRD TS).
- **Mobile:** Expo (current stable SDK), Expo Router, JSX/JS, TanStack Query, Zustand, react-hook-form + zod, i18next (`en`, `hi`, `gu`), Reanimated, `expo-*` modules from PRD §18. Install Expo deps via `npx expo install`.
- **Backend:** Node 20+, Express (ESM), Mongoose (MongoDB Atlas), zod, Supabase Auth (JWT verified on server) & Storage, `expo-server-sdk`.
- **Engine & AI:** Direct-first fetch (`cheerio`, `@mozilla/readability`, `jsdom`, `diff`, `pdf-parse`, `rss-parser`, `robots-parser`); SerpAPI budgeted for discovery/pinned search only. AI router: Gemini A (bg), Gemini B (user), Grok fallback; model names from env.
- **Scheduler:** `POST /internal/tick` guarded by `x-tick-secret` (GitHub Actions every 15m). `node-cron` dev-only.

## 3. Workflow
- Follow `../TIMELINE.md` in order as vertical slices (API + mobile + tests).
- Before each task: state plan in <=5 lines.
- After each task: run lint, format check, tests -> tick `../CHECKLIST.md` -> report in <=8 lines (changes, commands, decisions, risks, next).
- Stop at Phase gates (Day 2, 7, 11, 14) for user approval.
- Verify current official docs before using APIs. No stubs without `[~]` + Decision log. No deprecated APIs.

## 4. Non-Negotiable Quality Bar
- **Backend MVC:** `backend/src/` uses layered MVC (`routes/`, `controllers/`, `services/`, `validators/`, `models/`). Route files (`routes/<name>.route.js`, mounted in `routes/index.js`) contain wiring only (~30 lines or fewer) using `createXRouter(requireAuth, options)`; controllers read `req`, call services, return `ok()`, and never import models; services contain business rules + Mongoose queries, take plain args, never import Express or touch `req`/`res`; validators hold zod schemas; `engine/`, `ai/`, `security/`, and `integrations/` are called by services only.
- **API:** zod validation on every input; `{ success, data, error }` envelope; rate limits; consistent error codes.
- **Security:** SSRF guard on all user URLs; respect `robots.txt`; prompt-injection delimiters; trust tag set by code, never AI; unofficial disclaimers.
- **AI:** 1 call per change, zod schema + 1 retry + rules-only fallback; quotas enforced; no live APIs in tests (fixtures/mocks only).
- **Mobile UI:** route files live strictly in `mobile/src/app/` (no non-route files inside `src/app/`); feature UI and hooks belong in `mobile/src/features/<name>/` (no cross-feature imports) and `mobile/src/lib/` stays infrastructure-only; cross-folder imports in `mobile/src/` must use the `@/` path alias configured in `mobile/jsconfig.json` (no `../../` imports; keep `./` only within the same folder); colours/spacing from `src/theme/` tokens only (no hex in components); no gradients/drop shadows; all copy via i18n; OS font scaling; >=4.5:1 contrast; offline support per PRD.

## 5. Commands (`pnpm`)
- Backend: `cd backend && pnpm dev | lint | format:check | test`
- Mobile: `cd mobile && pnpm start | lint | format:check`
