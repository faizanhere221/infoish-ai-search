# Changelog

All notable changes to Infoishai Marketplace are documented here.

---

## [Unreleased] — Security Hardening Sprint — 2026-04-19

### Critical Security Fixes (`aaef1ba`)

- **Removed hardcoded admin password** from `src/app/admin/contacts/page.tsx`. Token now read from `localStorage` only; missing token aborts early. Token sent via `Authorization: Bearer` header instead of query string.
- **Created JWT authentication middleware** (`src/middleware.ts`) using `jose` for Edge-compatible JWT verification. Protects all `/api/*` routes. Injects `x-user-id`, `x-user-type`, `x-profile-id` headers. Public routes: `GET /api/creators`, `GET /api/brands`, `/api/auth/*`.
- **Required `JWT_SECRET` environment variable** in login route — no insecure fallback. Server throws at call time if env var is missing.
- **Added caller authorization to deal accept and approve routes** — `accept` verifies `x-user-type === 'creator'` and `deal.creator_id === x-profile-id`; `approve` verifies `x-user-type === 'brand'` and `deal.brand_id === x-profile-id`. Both return `403` for unauthorized callers.
- **Fixed wrong table names** `brand_profiles`/`creator_profiles` → `brands`/`creators` in `reviews/route.ts`, `deals/[id]/approve/route.ts`, and `deals/[id]/route.ts`. Review creation and deal approval stat updates were silently failing.

### TypeScript Fixes (`aaef1ba`)

- Added `src/types/google.d.ts` — declares Google Identity Services types on `Window`, eliminating 8 TS errors in `header.tsx` and `auth.ts`.
- Installed `pg` + `@types/pg` to resolve `Cannot find module 'pg'` error in `connection.ts`.
- Fixed implicit `any` parameters in `seed.ts` — typed `find()` callbacks explicitly.
- Replaced `src/lib/prisma.ts` with a stub — Prisma was never configured (no schema) and was not imported anywhere; project uses Supabase.

### Packages Added

- `pg` + `@types/pg` — PostgreSQL client and types
- `jose` — Edge-compatible JWT library for middleware

---

### High Priority Security Fixes (`c6d87c3`)

- **Rate limiting on auth routes** — Created `src/lib/rate-limit.ts` (in-memory, IP-keyed, auto-pruning). Login: 5 req/15 min. Register: 3 req/1 hr. Returns `429` with `Retry-After` header.
- **Zod validation on `POST /api/deals`** — `CreateDealSchema` validates all field types, UUIDs, numeric ranges, and string lengths. Caller's `brand_id` must match authenticated profile.
- **IDOR fix on `PUT /api/deals/[id]`** — Ownership check added: `x-profile-id` must be `creator_id` or `brand_id` on the deal.
- **Authorization on `POST /api/deals/[id]/deliver`** — Requires `x-user-type === 'creator'` and `deal.creator_id === x-profile-id`. TODO comment removed.
- **IDOR fix on `DELETE /api/conversations/[id]`** — Fetches conversation first, verifies `x-profile-id` is `creator_id` or `brand_id`. Returns `404` if not found, `403` if not a party.
- **Creator profile `PUT` hardened** — Added `UpdateCreatorSchema` (Zod, 9 whitelisted fields — blocks `verification_status`, `user_id`, etc.). Ownership check via `x-user-id` vs `creator.user_id`.
- **Security headers added to `next.config.js`** — CSP (scoped to known sources), HSTS (2-year + preload), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geo blocked).

---

### Medium Priority Security Fixes (`13c7228`)

- **Zod + ownership on `POST /api/conversations`** — UUID validation; caller must be `creator_id` or `brand_id` in the conversation.
- **Zod + ownership + log cleanup on `POST /api/brands`** — `CreateBrandSchema`; `x-user-id` must match `user_id`; removed `console.log` that printed full request body to server logs.
- **Zod + ownership on `PUT /api/brands/[id]`** — `UpdateBrandSchema` whitelists 9 safe fields; ownership check blocks modifying other brands.
- **Zod + reviewer ownership on `POST /api/reviews`** — `CreateReviewSchema`; `x-profile-id` must match `reviewer_id` — prevents submitting reviews on behalf of others.
- **`GET /api/brands` field restriction** — Replaced `select('*')` with explicit public field list (8 fields). Sensitive internal fields no longer returned in list views.
- **`GET /api/deals` pagination** — Added `limit` (max 50) + `offset`. Auto-scopes to caller's own profile. Requires at least one profile filter to prevent full table dumps.
- **Removed info-leaking `console.log`** from conversations GET — was logging `creatorId`, `brandId`, `userId` to server logs on every request.
- **`GET /api/brands/[id]` field restriction** — Replaced `select('*')` with explicit safe field list. Limit on list endpoint capped at 50.

---

### Low Priority Security Fixes (`7a655d8`)

- **Stripped DB internals from error responses** — Removed `details: error.message` and `code: error.code` from all affected routes (`deals`, `brands`, `conversations`, `creators`, `services`). Generic messages only.
- **NaN-safe pagination** — Applied `parseInt(...) || default` pattern to `limit`, `offset`, and `page` params across reviews and brands endpoints. Non-numeric values now fall back to safe defaults instead of producing `NaN` in range queries.
- **Typed creator/brand arrays in deals GET** — Replaced `any[]` with explicit `CreatorRow` and `BrandRow` interfaces matching the select field list.
- **Removed JWT from login JSON response body** — Token was returned in both the JSON body and an httpOnly cookie (double exposure). Cookie is now the sole transport mechanism.
- **Localhost image pattern restricted to development** — `http://localhost` in `next.config.js` image remotePatterns now conditional on `NODE_ENV === 'development'`. Production builds reject localhost image sources.
- **Services route rewritten** — Added `UpdateServicesSchema` (Zod, max 20 services, typed fields, price/day limits), ownership check, generic error responses, removed all `console.log` data dumps, `console.error` now logs message string only (not full error object with stack trace).

---

## Build Status

```
✓ TypeScript: 0 errors (npx tsc --noEmit)
✓ Build: npm run build — success
  - 47 static pages
  - 18 dynamic API routes
  - Middleware: 32.4 kB
```
