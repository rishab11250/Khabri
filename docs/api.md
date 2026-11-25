# Khabri API Reference

Response envelope: `{ "success": boolean, "data": T | null, "error": { "code": string, "message": string, "details"?: unknown } | null }`.

## Endpoints
- `GET /health` — Service & MongoDB connection health.
- `POST /internal/tick` — Scheduled tick trigger (requires `x-tick-secret` header).
- `GET /v1/me` — Fetch/auto-provision current user profile (Bearer Supabase JWT).
- `PATCH /v1/me` — Update profile, language (`en`|`hi`|`gu`), state, interests, quiet hours, digest time, onboarding flag.
- `DELETE /v1/me` — Delete user, cascade user records, decrement watched source follower counts, and delete Supabase user if service role configured.
- `POST /v1/devices`, `DELETE /v1/devices/:token` — Register or remove Expo push token.
- `GET /v1/catalog?category&state&q` — Browse and filter verified catalog sources.
- `GET /v1/catalog/trending` — Top followed sources.
- `GET, POST /v1/watches` — List or create watches (15-watch cap per user; max 3 search watches).
- `POST /v1/intake/link` — SSRF-guarded URL validation, classification (`listing`|`page`|`rss`), and unsupported JS-shell detection.
- `POST /v1/intake/photo` — Multipart notice photo scan via Gemini vision returning up to 3 watch proposals (5/day cap).
- `PATCH, DELETE /v1/watches/:id` — Edit, mute/priority toggle, or delete watch.
- `POST /v1/watches/:id/refresh` — Manual direct-source refresh (1-hour cooldown).
- `GET /v1/feed?cursor&limit` — Cursor-paged Today feed of Khabar Cards.
- `GET /v1/changes/:id` — Khabar Card detail with user checklist items.
- `GET, POST, PATCH, DELETE /v1/deadlines` — Deadline Ledger CRUD + moved-date history.
- `GET /demo/board`, `POST /demo/board` — Demo Notice Board HTML/JSON and mutations (`DEMO_MODE=true`).
