# Khabri Engineering Conventions

Rules enforced by ESLint, Prettier, and architectural review across `backend/` and `mobile/`.

## 1. Repository & Package Tooling

- **Package manager:** `pnpm@11.10.0` (Node 22 in CI). Never commit `package-lock.json` or npm artifacts.
- **Formatting:** Prettier enforces consistent layout across both workspaces (`pnpm format:check`).
- **Linting:** ESLint 10 (`eslint.config.mjs` in each workspace) treats errors as CI blockers:
  - `eqeqeq` (`always`), `no-var`, `prefer-const`, `no-empty`, `no-console`, `no-unused-vars` (`^_` prefix allowed for intentionally unused bindings).
  - `simple-import-sort/imports` and `simple-import-sort/exports` enforce grouped, sorted ES imports/exports.
  - Complexity/readability warnings (`complexity: 12`, `max-lines-per-function: 80` excluding blank lines and comments, `max-depth: 4`, `no-shadow`, `require-await`, `no-param-reassign`).
- **CI gate:** `.github/workflows/ci.yml` runs on push/PR to `main` and executes `pnpm install --frozen-lockfile`, non-blocking `pnpm audit --prod`, `pnpm lint`, `pnpm format:check`, plus `pnpm test` on `backend/`.

## 2. Backend Conventions (`backend/`)

- **Module system:** Pure ESM (`"type": "module"`) with explicit `.js` extensions on relative imports.
- **Layered MVC boundaries:**
  1. `src/routes/` — Express routers mounting validation and auth middleware, forwarding to controller functions.
  2. `src/validators/` — Zod schemas validating `body`, `params`, and `query` via `middleware/validate.js`. Because `req.query` is read-only in Express 5, validated query values attach to `req.validatedQuery` rather than mutating `req.query`.
  3. `src/controllers/` — Thin HTTP adapters extracting request fields, calling a service, and responding via `ok(res, data, status)` (`middleware/envelope.js`). Express 5 forwards rejected async promises automatically to `errors.js`.
  4. `src/services/` — Business logic, ownership checks, cap enforcement, and Mongo queries. Failures throw `AppError(status, code, message, details)`.
  5. `src/models/` — Mongoose schemas and indexes.
- **Standard API Envelope:** Every response returns `{ success: boolean, data: T | null, error: { code: string, message: string, details?: unknown } | null }`.
- **Logging:** Structured JSON logs via `pino` (`src/config/logger.js`) with automatic header/body redaction for credentials and secrets. `console.*` is disallowed by ESLint.

## 3. Mobile Conventions (`mobile/`)

- **Routing:** File-based Expo Router under `src/app/` (`_layout.jsx`, `(auth)/`, `(onboarding)/`, `(tabs)/`, `add/`, `circles/`, `change/`). Route files compose hooks and feature components and stay lean.
- **Feature-sliced organization:** Domain code lives under `src/features/<domain>/` (`changes`, `circles`, `deadlines`, `settings`, `watches`), split into hooks (`hooks/use*.js`), UI components (`components/*.jsx`), and feature helpers. Cross-app primitives stay in `src/components/`, `src/hooks/`, `src/lib/`, `src/store/`, `src/theme/`, `src/i18n/`, and `src/constants/`.
- **Styling & Theme Tokens:**
  - Always derive styles from `useStyles(createStyles)` or `useTheme()` (`src/theme/`).
  - Never hardcode colors, border widths, border radii, or spacing numbers inline in JSX when theme tokens apply (`no-restricted-syntax` flags inline `style={{ ... }}` object literals in JSX).
  - Typography uses `typeScale` and locale-aware font families from `getFontFamilies(language)` (`Fraunces` headlines, `Noto Sans` Latin/Devanagari/Gujarati).
- **Internationalization (`i18n`):** All user-facing copy lives in `src/i18n/{en,hi,gu}.json` and is accessed via `useTranslation()`. Never hardcode UI labels outside locale bundles.
- **State & Persistence:** Client auth/profile/offline stores use Zustand (`src/store/`) backed by `expo-secure-store` (session tokens), `expo-file-system` cache (`src/lib/fileCache.js`), and React Query for server state.

## 4. Comments & JSDoc Policy

- **Document exported surfaces:** `eslint-plugin-jsdoc` requires JSDoc (`jsdoc/require-jsdoc`, `jsdoc/require-param`, `jsdoc/require-returns`, `jsdoc/check-param-names`) on exported functions/components across all backend source layers and mobile `src/{lib,store,hooks,theme,features,components,app}/`.
- **Match destructured params:** When a function or component destructures an options/props object, document the parent object (`@param {object} props`) plus each destructured property (`@param {string} [props.field]`).
- **Explain non-obvious invariants ("why", not "what"):** Capture security bounds, race/lock windows, Express/RN platform quirks, heuristic thresholds, and fallback contracts concisely above the non-obvious block.
- **File headers:** Every source module starts with a brief `/** @file ... */` (or module summary docblock) stating its responsibility.

## 5. Git Commit Format

Commits follow Conventional Commits (`<type>(<scope>): <summary>`):
- Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `style`, `test`, `ci`.
- Scopes: `backend`, `mobile`, `docs`, `ci`, `repo`.
