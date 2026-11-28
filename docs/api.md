# Khabri API Reference

Base response envelope returned by all JSON endpoints:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

On failure (`4xx` / `5xx`), `data` is `null` and `error` has shape `{ "code": string, "message": string, "details"?: unknown }`.

## Authentication & Access Control

- **Public endpoints:** `/health`, `/auth/confirmed`, `/v1/catalog/*`, and `GET /demo/board`.
- **User endpoints (`/v1/*`):** Require `Authorization: Bearer <supabase_access_token>` (`middleware/auth.js`).
- **Internal job endpoints (`/internal/*`):** Require `x-tick-secret: <INTERNAL_TICK_SECRET>` header matching configured secret.

## Endpoints

### Health, Auth Landing & Internal Jobs
| Method & Path | Auth | Purpose | Notes / Limits |
|---|---|---|---|
| `GET /health` | Public | API & MongoDB health check | Returns connection status |
| `GET /auth/confirmed` | Public | Email verification HTML page | Links into `khabri://sign-in` |
| `POST /internal/tick` | `x-tick-secret` | Run scheduled source poll tick | Protected by 10-min Mongo `JobLock` |
| `POST /internal/digest` | `x-tick-secret` | Dispatch due daily digest notifications | Optional `{ force?: boolean }` body |

### User Profile & Devices
| Method & Path | Auth | Purpose | Notes / Limits |
|---|---|---|---|
| `GET /v1/me` | Bearer | Fetch or auto-provision profile | Syncs user identity from Supabase JWT |
| `PATCH /v1/me` | Bearer | Update language (`en`\|`hi`\|`gu`), state, interests, quiet hours, digest time, onboarding | Validated via Zod |
| `DELETE /v1/me` | Bearer | Cascade-delete user data & Supabase account | Decrements source `followerCount`; requires `SUPABASE_SERVICE_ROLE_KEY` for Auth delete |
| `POST /v1/devices` | Bearer | Register Expo push token + platform | Upserts by token |
| `DELETE /v1/devices/:token` | Bearer | Unregister push token | Removes user device binding |

### Catalog & Intake
| Method & Path | Auth | Purpose | Notes / Limits |
|---|---|---|---|
| `GET /v1/catalog` | Public | Browse/filter verified portals | Query params: `category`, `state`, `q` |
| `GET /v1/catalog/trending` | Public | Top followed verified portals | Ordered by `followerCount` |
| `POST /v1/intake/link` | Bearer | SSRF-guarded URL check & preview | Classifies `listing`\|`page`\|`rss`; flags JS-only `unsupported` sites |
| `POST /v1/intake/photo` | Bearer | Multipart notice photo scan via Gemini Vision | `photo` multipart field; 5/day user quota (`USER_DAILY_CAPS.photo`) |

### Watches
| Method & Path | Auth | Purpose | Notes / Limits |
|---|---|---|---|
| `GET /v1/watches` | Bearer | List user's watched sources | Includes latest source status & failure/unsupported state |
| `POST /v1/watches` | Bearer | Follow catalog source, URL, or search fallback | Cap: 15 watches/user, max 3 search watches |
| `PATCH /v1/watches/:id` | Bearer | Update `muted` or `priority` (`normal`\|`instant`) | Owner only |
| `DELETE /v1/watches/:id` | Bearer | Unfollow watch & decrement source followers | Owner only |
| `POST /v1/watches/:id/refresh` | Bearer | Trigger immediate source crawl | Direct sources only; 1-hour per-source cooldown |

### Feed, Changes & Checklists
| Method & Path | Auth | Purpose | Notes / Limits |
|---|---|---|---|
| `GET /v1/feed` | Bearer | Cursor-paged Today feed of Khabar Cards | Query params: `cursor`, `limit` |
| `GET /v1/changes/:id` | Bearer | Change detail with before/after diff & checklists | Scoped to user's watched/circle sources |
| `POST /v1/changes/:id/translate` | Bearer | Samjhao translation (`en`\|`hi`\|`gu`) | Cached per `(changeId, lang)` |
| `PATCH /v1/checklist/:id` | Bearer | Mark action checklist step `{ done: boolean }` | Owner only |

### Deadlines, Circles & Ask Khabri
| Method & Path | Auth | Purpose | Notes / Limits |
|---|---|---|---|
| `GET /v1/deadlines` | Bearer | List tracked & custom deadlines | Optional `status` filter; includes `previousDueAt` history |
| `POST /v1/deadlines` | Bearer | Create custom deadline | Validates title & `dueAt` timestamp |
| `PATCH /v1/deadlines/:id` | Bearer | Update deadline status/date | Owner only |
| `DELETE /v1/deadlines/:id` | Bearer | Delete deadline | Owner only |
| `GET /v1/circles` | Bearer | List Circles the user belongs to | — |
| `POST /v1/circles` | Bearer | Create Circle with 6-char invite code | Creator becomes `owner` |
| `POST /v1/circles/join` | Bearer | Join Circle via `{ inviteCode }` | Max 30 members per Circle |
| `GET /v1/circles/:id` | Bearer | Get Circle watches & member roster | Circle members only |
| `POST /v1/circles/:id/watches` | Bearer | Share a source `{ sourceId }` with Circle | Propagates watches to members within cap |
| `DELETE /v1/circles/:id/members/:userId` | Bearer | Remove a non-owner member | Circle owner only |
| `POST /v1/ask` | Bearer | Grounded Q&A over watched changes & snapshots | 10/day user quota (`USER_DAILY_CAPS.ask`) |

### Demo Board (`DEMO_MODE`)
| Method & Path | Auth | Purpose | Notes |
|---|---|---|---|
| `GET /demo/board` | Public | Serve local Demo Notice Board HTML/JSON | Used for repeatable offline/staging walkthroughs |
| `POST /demo/board` | Public (`DEMO_MODE=true`) | Inject/reset demo circular notice entries | Disabled unless `DEMO_MODE=true` |
