# Khabri API Reference

Base URL: `/v1` (except `/health` and `/internal/*` scheduler endpoints).
Response envelope: `{ "success": boolean, "data": T | null, "error": { "code": string, "message": string, "details"?: unknown } | null }`.

Endpoints will be documented per milestone as routes are implemented.
