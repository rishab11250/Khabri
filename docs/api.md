# Khabri API Reference

Response envelope: `{ "success": boolean, "data": T | null, "error": { "code": string, "message": string, "details"?: unknown } | null }`.

## Endpoints
- `GET /health` — Service & MongoDB connection health.
- `POST /internal/tick` — Scheduled tick trigger (requires `x-tick-secret` header).
- `GET /v1/me` — Fetch/auto-provision current user profile (Bearer Supabase JWT).
- `PATCH /v1/me` — Update profile, language (`en`|`hi`|`gu`), state, interests, quiet hours, digest time, onboarding flag.
- `DELETE /v1/me` — Delete user, cascade user records, decrement watched source follower counts, and delete Supabase user if service role configured.
