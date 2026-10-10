# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Infoishai is a B2B marketplace connecting tech brands with tech content creators (YouTube, Twitter/X, LinkedIn, GitHub, newsletters, podcasts) for sponsored content. It's a Next.js 14 (App Router) + TypeScript app backed by Supabase (Postgres). Brands discover and message creators directly, send deal proposals, or post campaigns that creators apply to. There's also a referral/affiliate ("partner") system and an admin back office.

## Commands

```bash
npm run dev      # dev server (localhost:3000)
npm run build    # production build — also runs the TypeScript check (no separate type-check script)
npm run start    # run a production build
npm run lint     # next lint (ESLint)
```

There is no test suite (no Jest/Vitest/Playwright config, no `test` script). Verify changes with `npm run build` and `npm run lint`; for UI changes, also run the app and click through the flow.

When debugging something that looks impossible from reading the code (stale data, phantom errors, a route that behaves differently than its source), suspect a stale `.next` cache before anything else: `rm -rf .next && npm run build`. If a build fails with `Cannot find module for page: ...`, a leftover `next dev`/`next start` process from an earlier session is usually holding a lock on `.next` — find it with `netstat -ano | grep LISTENING` (ports 3000 and other `next start -p <port>` ports) and kill it before rebuilding.

## Architecture

### Auth

JWT-based, **not** Supabase Auth. `src/middleware.ts` verifies the token (via `jose`) from either the `Authorization: Bearer` header or the `auth_token` cookie, then injects trusted `x-user-id` / `x-user-type` / `x-profile-id` / `x-user-role` headers onto the request — API routes read identity from these headers, never from the request body. The middleware strips any client-supplied versions of these headers first, so routes can trust them unconditionally. `/admin/*` page routes and `/api/admin/*` routes additionally require `role === 'admin' | 'super_admin'`.

Client-side, pages read/write `localStorage` directly (`auth_token`, `auth_user`, `auth_profile`) rather than going through a shared context — see any dashboard page or `DashboardHeader.tsx` for the pattern. **`src/hooks/useAuth.tsx` (`AuthProvider`/`useAuth`) is fully built but never mounted anywhere — don't use it or assume it's wired up.**

### Data layer

Supabase is the only database access path that's actually used: `createServerSupabase()` in `src/lib/db.ts` (service-role key, bypasses RLS) is used in ~all API routes. `src/lib/supabase.ts` is the anon-key client for contexts that should respect RLS.

Dead/unused, do not build on these: `src/lib/prisma.ts` (stub, Prisma isn't configured), `src/lib/database/connection.ts` + `models.ts` (a raw `pg` Pool layer, unreferenced anywhere), `src/lib/auth/config.ts` (empty file). Also unused: the `useCreator`/`useBrand`/`useDeals`/`useMessages` hooks in `src/hooks/` (only `usePartner` is actually called). `components.json` configures shadcn/ui but `src/components/ui/` was never created — there's no shadcn component library here, just hand-written Tailwind components.

No ORM/query builder — routes call the Supabase JS client directly. Relations are generally fetched as separate queries and joined manually in application code (see `src/app/api/deals/route.ts`) rather than via Supabase's nested `select()` syntax.

### Database schema

`supabase/schema.sql` is the base schema for a fresh install (users, creators, brands, deals, messages, reviews, notifications, etc.). Everything added since then lives in standalone `supabase/*_migration.sql` files (campaigns, applications, referral system, activity log, admin, newsletter/contact, creator profile views, settings) — there's no migration runner, so the *current* schema is schema.sql plus every migration file, and new schema changes should follow the same pattern (a new `supabase/<feature>_migration.sql`, applied manually in the Supabase SQL editor). Several permission classifiers won't allow direct DB writes/DDL from the agent — when that happens, write the migration file and tell the user to run it rather than finding a workaround.

### API route conventions

- Request body validation with `zod` (`Schema.safeParse`, 400 + `error.flatten().fieldErrors` on failure).
- Ownership checks compare the authenticated `x-profile-id`/`x-user-type` against the resource being acted on (e.g. "you can only create deals as your own brand") — never trust an id passed in the body for who the caller is.
- Response shape: `{ error: string }` with an appropriate status code on failure (routes catch-all to 500 "Internal server error"); `{ <resource>: ... }` on success, `{ message, <resource> }` for creates.
- GET list routes take `limit`/`offset` query params, clamped server-side.

### Payments

`stripe`/`@stripe/stripe-js` are listed as dependencies and older docs (`reame.md`) describe "Stripe Connect" and "escrow payments," but **no Stripe integration actually exists** — there are no `/api/stripe/*` routes and no Stripe calls anywhere in `src/`. Deals only track `platform_fee`/`creator_payout` as numbers computed in the API route (currently a flat 10% platform fee); no money actually moves through the app. Don't describe escrow/Stripe as a working feature in UI copy — it was deliberately stripped from the landing page and about page in recent work for exactly this reason.

### Frontend structure

- `src/app/page.tsx` (and `src/app/about/page.tsx`, etc.) are thin wrappers — the actual landing-page sections (`HeroSection`, `ForBrandsSection`, `FAQSection`, `Footer`, `Navigation`, ~18 sections total) are exported from `src/components/landing/index.tsx`. Check there, not `page.tsx`, when a "landing page" change is requested.
- Three separate header implementations exist and must be kept in sync for sitewide changes: `src/components/header.tsx` (public pages — blog, tools, country pages, contact, legal), `src/components/DashboardHeader.tsx` (logged-in dashboard/settings/messages pages), and `Navigation` inside `src/components/landing/index.tsx` (homepage/about only). Likewise there are two footers: `src/components/footer.tsx` (public pages) and `Footer` inside `landing/index.tsx` (homepage/about).
- Brand colors are defined in `tailwind.config.js` under `theme.extend.colors.brand` (`brand-pink` #de5688, `brand-purple` #b153c8, plus `-light`/`-dark` variants) and used as `bg-brand-pink/10`, `from-brand-pink to-brand-purple`, etc. A few platform-specific colors are intentionally left as plain Tailwind colors (e.g. LinkedIn's `bg-blue-600`, subscription-tier badges) because they're semantic, not brand accents — don't "fix" those.
- No semicolons, single quotes, 100-char print width (Prettier + `prettier-plugin-tailwindcss`, which also sorts Tailwind classes). `@/*` resolves to `src/*`.

### Feature areas

- **Referral/partner system** (`docs/REFERRAL_SYSTEM.md` has the full flow): partners get a referral link, signups are tracked via cookie through profile completion, commissions are calculated automatically when a referred creator's deal is approved and paid out. Dashboard at `/dashboard/partner`, admin management under `/admin/partners`.
- **Campaigns**: brands post campaigns, creators browse/apply (`/campaigns`, `/dashboard/campaigns`, `/api/campaigns`, `/api/applications`) as an alternative to direct deal proposals.
- **Admin back office**: `/admin/*` pages + `/api/admin/*` routes for users, creators, brands, deals, partners, newsletter/contact submissions, activity log, analytics — gated by the `admin`/`super_admin` role check in middleware.
- **Programmatic SEO**: country-specific landing pages under `src/app/influencers/<country>/` and a large blog under `src/app/blog/`, both built for organic search.

### Noise in the repo root

`requirements.txt` and parts of `TODO.md` are leftovers from an unrelated Python/FastAPI project and don't describe this codebase — ignore them. `reame.md` (typo'd filename) is a more detailed but partly stale README; `README.md` is the untouched `create-next-app` default.
