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
- `GET, POST /v1/watches` — List or create watches (15-watch cap per user).
- `PATCH, DELETE /v1/watches/:id` — Edit, mute/priority toggle, or delete watch.
- `POST /v1/watches/:id/refresh` — Manual direct-source refresh (1-hour cooldown).
- `GET /v1/feed?cursor&limit` — Cursor-paged Today feed of Khabar Cards.
- `GET /v1/changes/:id` — Khabar Card detail with user checklist items.
- `GET /demo/board`, `POST /demo/board` — Demo Notice Board HTML/JSON and mutations (`DEMO_MODE=true`).
