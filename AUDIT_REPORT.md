# Security Audit Report — Infoishai Marketplace

**Audit Date:** 2026-04-19
**Audited By:** Claude Sonnet 4.6 (AI-assisted audit)
**Status:** ALL ISSUES RESOLVED ✅

---

## Summary

| Severity | Total | Fixed |
|----------|-------|-------|
| CRITICAL | 5     | 5 ✅  |
| HIGH     | 7     | 7 ✅  |
| MEDIUM   | 8     | 8 ✅  |
| LOW      | 6     | 6 ✅  |
| **Total**| **26**| **26 ✅** |

---

## CRITICAL Issues — All Fixed ✅

### C-1 — Hardcoded Admin Password in Source Code
- **File:** `src/app/admin/contacts/page.tsx:28`
- **Risk:** Password `"Kakayrao1029?!"` committed to version control; anyone with repo access could authenticate as admin.
- **Fix:** Removed hardcoded fallback entirely. Token is read from `localStorage('admin_token')` only; missing token aborts the request early. Token sent via `Authorization: Bearer` header, not query string.
- **Commit:** `aaef1ba`

### C-2 — No Authentication Middleware on API Routes
- **File:** `src/` (missing `middleware.ts`)
- **Risk:** All API routes were publicly accessible without authentication.
- **Fix:** Created `src/middleware.ts` using `jose` (Edge-compatible JWT). Verifies token from `Authorization` header or `auth_token` cookie. Injects `x-user-id`, `x-user-type`, `x-profile-id` headers for downstream use. Public exceptions: `GET /api/creators`, `GET /api/brands`, `/api/auth/*`.
- **Commit:** `aaef1ba`

### C-3 — Hardcoded JWT Secret Fallback
- **File:** `src/app/api/auth/login/route.ts:6`
- **Risk:** `|| 'your-secret-key-change-in-production'` meant JWT tokens were signed with a known public string if env var was unset.
- **Fix:** Replaced with `getJwtSecret()` function that throws at call-time if `JWT_SECRET` is missing. No fallback exists.
- **Commit:** `aaef1ba`

### C-4 — Missing Authorization on Deal Accept/Approve Routes
- **Files:** `src/app/api/deals/[id]/accept/route.ts`, `src/app/api/deals/[id]/approve/route.ts`
- **Risk:** Any authenticated user could accept or approve any deal, regardless of whether they were a party to it.
- **Fix:** Both routes now read `x-profile-id` and `x-user-type` from middleware headers and verify the caller is the correct party. `accept` requires `user_type === 'creator'` and `deal.creator_id === profileId`. `approve` requires `user_type === 'brand'` and `deal.brand_id === profileId`.
- **Commit:** `aaef1ba`

### C-5 — Wrong Table Names in Reviews and Deals Routes
- **Files:** `src/app/api/reviews/route.ts`, `src/app/api/deals/[id]/approve/route.ts`, `src/app/api/deals/[id]/route.ts`
- **Risk:** Routes queried non-existent tables `brand_profiles` and `creator_profiles` instead of `brands` and `creators`, causing all review creation and deal approval stat updates to silently fail.
- **Fix:** Replaced all occurrences of `brand_profiles` → `brands` and `creator_profiles` → `creators`.
- **Commit:** `aaef1ba`

---

## HIGH Issues — All Fixed ✅

### H-1 — No Rate Limiting on Authentication Routes
- **Files:** `src/app/api/auth/login/route.ts`, `src/app/api/auth/register/route.ts`
- **Risk:** Unlimited brute-force attempts against user credentials.
- **Fix:** Created `src/lib/rate-limit.ts` (in-memory, IP-keyed). Login: 5 requests per 15 minutes. Register: 3 requests per hour. Returns `429` with `Retry-After` header. Map auto-prunes expired entries every 60 seconds.
- **Commit:** `c6d87c3`

### H-2 — No Input Validation on Deal Creation
- **File:** `src/app/api/deals/route.ts:93`
- **Risk:** Unvalidated JSON body accepted arbitrary field types and values; no schema enforcement.
- **Fix:** Added `CreateDealSchema` (Zod) validating all fields with UUID checks, string lengths, numeric ranges, and datetime format. Also added ownership check: caller's `brand_id` must match the authenticated brand's profile ID.
- **Commit:** `c6d87c3`

### H-3 — IDOR on Deal Updates
- **File:** `src/app/api/deals/[id]/route.ts:56`
- **Risk:** Any authenticated user could `PUT` to update any deal by ID with no ownership check.
- **Fix:** Route now checks `x-profile-id` against `deal.creator_id` and `deal.brand_id` before allowing updates.
- **Commit:** `c6d87c3`

### H-4 — Missing Authorization on Deal Delivery
- **File:** `src/app/api/deals/[id]/deliver/route.ts:42`
- **Risk:** TODO comment confirmed any authenticated user could submit deliveries for deals they don't own.
- **Fix:** Route now requires `x-user-type === 'creator'` and verifies `deal.creator_id === x-profile-id`. Returns `403` otherwise.
- **Commit:** `c6d87c3`

### H-5 — IDOR on Conversation Deletion
- **File:** `src/app/api/conversations/[id]/route.ts:65`
- **Risk:** `DELETE /api/conversations/[id]` deleted any conversation without verifying the caller was a party to it.
- **Fix:** Route fetches conversation first, checks `x-profile-id` against `creator_id` and `brand_id`. Returns `404` if not found, `403` if not a party.
- **Commit:** `c6d87c3`

### H-6 — Unvalidated Creator Profile Updates (`...body` Spread)
- **File:** `src/app/api/creators/[id]/route.ts:98`
- **Risk:** Full `...body` spread into Supabase `update()` allowed attackers to overwrite `verification_status`, `user_id`, and any other column.
- **Fix:** Added `UpdateCreatorSchema` (Zod, 9 whitelisted fields). Added ownership check: `x-user-id` must match `creator.user_id`. Returns `403` otherwise.
- **Commit:** `c6d87c3`

### H-7 — Missing Security Headers
- **File:** `next.config.js:67`
- **Risk:** No CSP, X-Frame-Options, HSTS, X-Content-Type-Options, or Referrer-Policy headers — vulnerable to XSS, clickjacking, and MIME sniffing.
- **Fix:** Added full security header suite to `next.config.js`: Content-Security-Policy (scoped to known sources), HSTS (2-year, preload), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geo blocked).
- **Commit:** `c6d87c3`

---

## MEDIUM Issues — All Fixed ✅

### M-1 — No Validation on `POST /api/conversations`
- **File:** `src/app/api/conversations/route.ts:89`
- **Fix:** Added `CreateConversationSchema` (Zod UUID validation). Caller must be `creator_id` or `brand_id` — returns `403` otherwise.
- **Commit:** `13c7228`

### M-2 — No Validation on `POST /api/brands`
- **File:** `src/app/api/brands/route.ts:44`
- **Fix:** Added `CreateBrandSchema` (Zod, all fields typed with length limits). Ownership check: `x-user-id === user_id`. Removed `console.log` that printed full request body.
- **Commit:** `13c7228`

### M-3 — No Validation / Full `...body` Spread on `PUT /api/brands/[id]`
- **File:** `src/app/api/brands/[id]/route.ts:38`
- **Fix:** Added `UpdateBrandSchema` (Zod, 9 whitelisted fields — blocks `verification_status`, `user_id`, etc.). Ownership check via `x-user-id` vs `brand.user_id`.
- **Commit:** `13c7228`

### M-4 — Weak Validation on `POST /api/reviews`
- **File:** `src/app/api/reviews/route.ts:87`
- **Fix:** Added `CreateReviewSchema` (Zod, all 9 fields typed). Reviewer ownership check: `x-profile-id` must match `reviewer_id` — prevents submitting reviews on behalf of others.
- **Commit:** `13c7228`

### M-5 — `GET /api/brands` Returned All Fields via `select('*')`
- **File:** `src/app/api/brands/route.ts:13`
- **Fix:** Replaced with explicit public field list: `id, company_name, logo_url, industry, country, contact_name, verification_status, created_at`.
- **Commit:** `13c7228`

### M-6 — Unbounded `GET /api/deals` — No Pagination
- **File:** `src/app/api/deals/route.ts:26`
- **Fix:** Added `limit` (max 50) + `offset` pagination. Auto-scopes to caller's own profile by `x-user-type`. Requires at least one profile filter — prevents full table dump.
- **Commit:** `13c7228`

### M-7 — `console.log` Leaking Query Params (User IDs) in Server Logs
- **File:** `src/app/api/conversations/route.ts:14`
- **Fix:** Removed `console.log('Fetching conversations...', { creatorId, brandId, userId })` and the follow-up count log.
- **Commit:** `13c7228`

### M-8 — `GET /api/brands` Returned All Brands Uncapped
- **File:** `src/app/api/brands/route.ts:5`
- **Fix:** Capped `limit` at 50 (was uncapped — callers could pass `limit=100000`). `GET /api/brands/[id]` also replaced `select('*')` with an explicit safe field list.
- **Commit:** `13c7228`

---

## LOW Issues — All Fixed ✅

### L-1 — DB Error Messages Leaked to Clients via `details: error.message`
- **Files:** `deals/route.ts`, `brands/route.ts`, `conversations/route.ts`, `creators/route.ts`, `services/route.ts`
- **Fix:** Removed `details: error.message` and `code: error.code` from all 5 affected error responses. Generic messages only returned to clients.
- **Commit:** `7a655d8`

### L-2 — `parseInt()` on Pagination Params Not Guarded Against NaN
- **Files:** `src/app/api/reviews/route.ts:24`, `src/app/api/brands/route.ts:25`
- **Fix:** Applied `parseInt(...) || default` pattern — NaN coerces to the safe default. Combined with `Math.min`/`Math.max` bounds.
- **Commit:** `7a655d8`

### L-3 — `any[]` Types for Creator/Brand Arrays in Deals GET
- **File:** `src/app/api/deals/route.ts:89`
- **Fix:** Replaced with typed `CreatorRow` and `BrandRow` interfaces matching the exact `select()` field list.
- **Commit:** `7a655d8`

### L-4 — JWT Token Returned in Both JSON Response Body and httpOnly Cookie
- **File:** `src/app/api/auth/login/route.ts:107`
- **Fix:** Removed `token` field from JSON response body. The httpOnly cookie set on the same response is the correct and sole transport mechanism.
- **Commit:** `7a655d8`

### L-5 — `http://localhost` Image Pattern Included in Production Config
- **File:** `next.config.js:43`
- **Fix:** Wrapped localhost image pattern in `process.env.NODE_ENV === 'development'` conditional — production builds no longer permit `http://localhost` image sources.
- **Commit:** `7a655d8`

### L-6 — Services Route: DB Internals in Error Response + Data Dumps in Logs
- **File:** `src/app/api/creators/[id]/services/route.ts:52`
- **Fix:** Full rewrite — added `UpdateServicesSchema` (Zod, max 20 services, all fields typed), ownership check, generic error responses (no `details`/`code`), removed all `console.log` data dumps, `console.error` now logs `error.message` string only.
- **Commit:** `7a655d8`

---

## Packages Added

| Package | Version | Purpose |
|---------|---------|---------|
| `pg` | latest | PostgreSQL client (was imported, not installed) |
| `@types/pg` | latest | TypeScript types for pg |
| `jose` | latest | Edge-compatible JWT verification for middleware |
| `zod` | already present | Schema validation (activated across API routes) |

---

## TypeScript
All fixes maintain zero TypeScript errors (`npx tsc --noEmit` passes clean).

## Build
Production build (`npm run build`) compiles successfully — 47 static pages, 18 API routes, middleware (32.4 kB). Two `jose` edge-runtime warnings are from an unused JWE decrypt code path in the library, not from our `jwtVerify` usage.
