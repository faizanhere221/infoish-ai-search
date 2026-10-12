# CLAUDE.md — Infoishai Project Rules

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Infoishai** (infoishai.com) is a free B2B marketplace connecting tech brands with verified tech content creators (YouTube, Twitter/X, LinkedIn, GitHub, newsletters, podcasts) across 9 countries (USA, UK, Canada, India, Pakistan, Australia, Germany, Netherlands, Singapore). Brands discover and message creators directly, send deal proposals, or post campaigns that creators apply to. There is also a referral/affiliate ("partner") system and an admin back office.

## Brand Identity

- **Primary Pink:** defined in `tailwind.config.js` as `brand-pink` (#de5688) with `-light`/`-dark` variants
- **Gradient:** `from-brand-pink to-brand-purple` (#b153c8)
- **Dark Background:** #1A1A2E
- **Product Name:** Infoishai (capital I, lowercase everything else)
- Platform-specific colors (LinkedIn blue, subscription-tier badges) are intentionally plain Tailwind colors because they are semantic, not brand accents. Do not "fix" those.

## Commands

```bash
npm run dev      # dev server (localhost:3000)
npm run build    # production build — also runs the TypeScript check (no separate type-check script)
npm run start    # run a production build
npm run lint     # next lint (ESLint)
```

There is no test suite (no Jest/Vitest/Playwright config, no `test` script). Verify changes with `npm run build` and `npm run lint`. For UI changes, also run the app and click through the flow.

### Debugging Tip

When something looks impossible from reading the code (stale data, phantom errors, a route that behaves differently than its source), suspect a stale `.next` cache before anything else: `rm -rf .next && npm run build`. If a build fails with `Cannot find module for page: ...`, a leftover `next dev`/`next start` process from an earlier session is holding a lock on `.next`. Find it with `netstat -ano | grep LISTENING` (ports 3000 and other `next start -p <port>` ports) and kill it before rebuilding.

## Tech Stack (DO NOT change versions without asking)

- **Framework:** Next.js 14.2.35 (App Router), React 18.3.1, TypeScript 5.9.3
- **Database:** Supabase (Postgres) via `@supabase/supabase-js` and `@supabase/ssr`
- **Auth:** Custom JWT. `bcryptjs` for hashing (cost 12), `jsonwebtoken` for signing, `jose` for verification in middleware
- **Styling:** Tailwind CSS 3.4.19 with `@tailwindcss/forms`, `@tailwindcss/typography`, `tailwind-merge`, `class-variance-authority`
- **Forms:** `zod` for validation, `react-hook-form` for form state
- **Icons:** `lucide-react` (import individual icons by name, tree-shakeable)
- **Utilities:** `date-fns`, `clsx`
- **Error Tracking:** Sentry (`@sentry/nextjs`)
- **Analytics:** Google Analytics 4 (measurement ID: G-Y97NRDZSBB), gated behind cookie consent
- **Formatter:** Prettier (no semicolons, single quotes, 100-char width, `prettier-plugin-tailwindcss` sorts Tailwind classes)
- **Linter:** ESLint with `eslint-config-next`, `@typescript-eslint`, `react-hooks`
- **Path alias:** `@/*` resolves to `src/*`

## Architecture

### Auth — CRITICAL

JWT-based, **NOT Supabase Auth**. Never use `supabase.auth.*` methods.

1. `/api/auth/login` and `/api/auth/register` validate credentials against the `users` table, hash with bcrypt (cost 12), and issue JWTs using `jsonwebtoken`
2. `src/middleware.ts` verifies JWTs using `jose` from either the `Authorization: Bearer` header or the `auth_token` cookie, then injects trusted `x-user-id`, `x-user-type`, `x-profile-id`, `x-user-role` headers. It strips any client-supplied versions of these headers first, so routes can trust them unconditionally.
3. API routes read identity ONLY from these injected headers, never from request body or query params
4. `/admin/*` page routes and `/api/admin/*` routes additionally require `role === 'admin' | 'super_admin'`
5. Client-side reads `localStorage` directly: `auth_token`, `auth_user`, `auth_profile`. **`src/hooks/useAuth.tsx` (`AuthProvider`/`useAuth`) is fully built but never mounted anywhere. Do not use it or assume it is wired up.**

### Data Layer

`createServerSupabase()` in `src/lib/db.ts` (service-role key, bypasses RLS) is used in all API routes. `src/lib/supabase.ts` is the anon-key client for browser contexts.

No ORM or query builder. Routes call the Supabase JS client directly. Relations are generally fetched as separate queries and joined manually in application code (see `src/app/api/deals/route.ts`) rather than via Supabase's nested `select()` syntax.

**Dead/unused data layers (removed in audit, do not recreate):** Prisma, raw `pg` Pool, `src/lib/auth/config.ts`, `components.json` (shadcn/ui was never set up). The `useCreator`, `useBrand`, `useDeals`, `useMessages` hooks in `src/hooks/` are also unused (only `usePartner` is active).

### Database Schema (25 tables)

`supabase/schema.sql` is the base schema. Everything added since lives in standalone `supabase/*_migration.sql` files. There is no migration runner. The current schema is `schema.sql` plus every migration file. New schema changes should follow the same pattern: write a new `supabase/<feature>_migration.sql` and tell the user to run it in the Supabase SQL Editor. Permission classifiers may block direct DDL from the agent. When that happens, write the migration file and tell the user to run it.

**Core:** users, creators, creator_platforms, creator_services, creator_portfolio, brands, deals, deal_messages, conversations, messages, reviews, notifications, saved_creators, payments

**Campaigns:** campaigns, campaign_deliverables, campaign_applications

**Referral:** referral_partners, referral_signups, referral_commissions, referral_payouts

**Admin/Ops:** activity_logs, platform_settings, contact_messages, newsletter_subscribers

**Infrastructure:** rate_limits

**Key column notes:**
- `users.role`: `'user' | 'admin' | 'super_admin'`
- `deals.deliverables`: JSONB array of `{id, description, is_completed}`
- `creators.profile_views`: INTEGER counter, incremented by public API
- Platform fee: 10% on deals (defined in `src/lib/referral-commissions.ts`)
- Referral commission: percentage of the platform fee, not the deal amount

### API Route Conventions

Every API route lives under `src/app/api/` and exports named functions (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).

- Request body validation with `zod` (`Schema.safeParse`, 400 + `error.flatten().fieldErrors` on failure)
- Ownership checks compare the authenticated `x-profile-id`/`x-user-type` against the resource. Never trust an id passed in the body for who the caller is.
- Response shape: `{ error: string }` with appropriate status on failure (catch-all to 500 "Internal server error"); `{ <resource>: ... }` on success; `{ message, <resource> }` for creates
- GET list routes take `limit`/`offset` query params, clamped server-side
- Use `captureError()` from `src/lib/error-tracking.ts` in catch blocks for Sentry tracking

**Protected route pattern:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createServerSupabase()
  // ... your logic
}
```

**Admin route pattern:**
```typescript
const userRole = request.headers.get('x-user-role')
if (userRole !== 'admin' && userRole !== 'super_admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Middleware (src/middleware.ts)

Handles three concerns:
1. JWT verification on protected routes
2. Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) on ALL responses
3. Admin page redirects for unauthenticated users

**When adding new API routes:** if the route is public (no auth needed), add it to the public routes list in middleware. If the route needs optional auth (works with or without login), add it to the optional-auth list. Everything else requires auth by default.

**When adding new external scripts or domains:** add the domain to the appropriate CSP directive in middleware and document why.

### Rate Limiting

Database-backed (Postgres, `rate_limits` table). Import from `src/lib/rate-limit.ts`. Apply to all sensitive endpoints (auth, contact, public write endpoints). Fails open (allows requests) if the database query fails, so it never blocks legitimate traffic due to a DB hiccup. Never use in-memory Maps/Sets for rate limiting. Vercel serverless functions have no shared memory between invocations.

### Error Handling

- Use `captureError()` and `captureMessage()` from `src/lib/error-tracking.ts` for Sentry tracking
- Every API route should have try/catch around the main logic
- Return proper HTTP status codes (400 bad input, 401 unauthorized, 403 forbidden, 404 not found, 500 server errors)
- Never expose internal error details to the client. Log server-side, return generic message.
- `src/app/error.tsx` and `src/app/global-error.tsx` handle unhandled client errors

### Payments

`stripe`/`@stripe/stripe-js` were removed in the audit. **No payment integration exists.** Deals only track `platform_fee`/`creator_payout` as computed numbers (10% platform fee). No money moves through the app. Do not describe escrow/Stripe as a working feature in UI copy.

### Cookie Consent

`src/components/CookieConsent.tsx` gates GA4 scripts behind user consent. If you add any new tracking or third-party scripts, gate them behind the cookie consent check.

## Frontend Structure

### Components

- Use `'use client'` directive ONLY when the component needs browser APIs, event handlers, hooks, or state. Default to server components.
- Import images with `next/image` (`<Image>`), never plain `<img>` tags
- Use Tailwind utility classes. No CSS modules, no styled-components, no inline `style` props unless absolutely necessary.
- Use `cn()` from `src/lib/utils.ts` (wraps `clsx` + `tailwind-merge`) for conditional class merging
- Icons: `import { IconName } from 'lucide-react'` — always import individual icons, never barrel export

### Three Headers, Two Footers

Three separate header implementations exist and must be kept in sync for sitewide changes:
1. `src/components/header.tsx` — public pages (blog, tools, country pages, contact, legal)
2. `src/components/DashboardHeader.tsx` — logged-in dashboard/settings/messages pages
3. `Navigation` inside `src/components/landing/index.tsx` — homepage/about only

Two footers:
1. `src/components/footer.tsx` — public pages
2. `Footer` inside `src/components/landing/index.tsx` — homepage/about

### Landing Page

`src/app/page.tsx` is a thin wrapper. The actual homepage sections (~18 named exports: `HeroSection`, `ForBrandsSection`, `FAQSection`, etc.) are all in `src/components/landing/index.tsx`. Check there for "landing page" changes.

### Page Conventions

- Every page should export `metadata` (or `generateMetadata()` for dynamic) with at minimum: `title`, `description`
- Title template from layout: `"Page Name | Infoishai"`
- Public-facing pages must have a single `<h1>` tag
- Dashboard and admin pages should be `noindex` (handled by robots.ts, verify when adding new private routes)
- Blog and country pages use ISR: `export const revalidate = 86400` (24 hours)
- Marketplace/campaign pages use: `export const revalidate = 3600` (1 hour)

## File Organization

```
src/
  app/                  # Next.js App Router pages and API routes
    api/                # API routes (route.ts files)
    (auth)/             # Auth pages (login, signup, forgot-password)
    admin/              # Admin dashboard (15 pages)
    dashboard/          # User dashboard (12 pages)
    blog/               # Blog (19 pages)
    influencers/        # Country landing pages (9 pages)
    tools/              # Tool pages
    campaigns/          # Campaign pages
    creators/           # Creator marketplace + profiles
  components/           # React components (66 files)
    admin/              # Admin components
    applications/       # Campaign application components
    campaigns/          # Campaign components
    creator/            # Creator profile components
    dashboard/          # Dashboard components
    deals/              # Deal components
    influencers/        # Country FAQ components
    landing/index.tsx   # ALL homepage sections (18 exports)
    marketplace/        # Creator search/filter components
    messaging/          # Chat/message components
    partner/            # Referral partner components
    referral/           # Referral banner
    seo/                # JSON-LD and SEO components
    CookieConsent.tsx   # Cookie consent banner
  config/product.ts     # App configuration
  hooks/                # Custom hooks (only usePartner.ts is active)
  lib/
    rate-limit.ts       # Database-backed rate limiting
    db.ts               # Server-side Supabase client (service-role key)
    supabase.ts         # Client-side Supabase client (anon key)
    analytics.ts        # GA4 event tracking helpers
    error-tracking.ts   # Sentry wrapper (captureError, captureMessage)
    utils.ts            # cn() helper and other utilities
    referral.ts         # Referral tracking
    referral-commissions.ts  # Commission calculations
    notifications.ts    # Notification helpers
  middleware.ts         # JWT verification + security headers + admin redirects
  types/                # TypeScript type definitions
  utils/                # Utility functions (admin, auth, constants, validation)
supabase/               # SQL schema and migration files
```

## Feature Areas

- **Referral/partner system** (`docs/REFERRAL_SYSTEM.md`): partners get a referral link, signups tracked via cookie through profile completion, commissions calculated when a referred creator's deal is approved. Dashboard at `/dashboard/partner`, admin at `/admin/partners`.
- **Campaigns**: brands post campaigns, creators browse/apply (`/campaigns`, `/dashboard/campaigns`, `/api/campaigns`, `/api/applications`).
- **Admin back office**: `/admin/*` pages + `/api/admin/*` routes for users, creators, brands, deals, partners, newsletter/contact, activity log, analytics.
- **Programmatic SEO**: 9 country landing pages under `src/app/influencers/` and 18+ blog posts under `src/app/blog/`.

## DO NOT

- **Do not install new dependencies** without asking first. Check if existing packages cover the need.
- **Do not modify `src/middleware.ts`** without understanding the full auth flow. A bug here locks everyone out or lets everyone in.
- **Do not use Supabase Auth** methods (`supabase.auth.signIn()`, `supabase.auth.signUp()`, etc.).
- **Do not put secrets in client-side code.** Only `NEXT_PUBLIC_*` env vars are safe for the browser.
- **Do not use `dangerouslySetInnerHTML`** unless rendering JSON-LD scripts with `JSON.stringify()` on server-controlled data.
- **Do not commit `.env` or `.env.local`** files. Update `.env.example` if you add new env vars.
- **Do not add files to `data/` or `public/uploads/`** — these are gitignored after a PII cleanup. Use Supabase Storage for uploads.
- **Do not use in-memory storage** (Maps, Sets, global variables) for anything that needs to persist across requests. Vercel serverless functions have no shared memory.
- **Do not skip TypeScript types.** No `any` unless unavoidable, with a `// TODO: type this properly` comment.
- **Do not use `console.log` for error handling.** Use `captureError()` for Sentry tracking.
- **Do not recreate dead code** that was removed in the audit: Prisma, pg Pool, empty AI/social stubs, unused hooks, shadcn/ui config.
- **Do not describe Stripe/escrow as a working feature** in any UI copy.

## Known Limitations (work around, do not "fix" the architecture)

1. **RLS policies are decorative.** They reference `auth.uid()` which never resolves because we use custom JWT, not Supabase Auth. All real authorization is in the API route layer. This is fine as long as the service-role key stays server-side.
2. **No email sending capability.** SMTP env vars exist but no email code is wired up. Ask before implementing.
3. **Google Login button was removed.** No OAuth provider is configured. Do not add OAuth without explicit instruction.
4. **Instagram Profile Analyzer** (`/tools/instagram-profile-analyzer`) calls a dead backend. Non-functional. Do not fix without instruction on what API to use.

## Before Every Change

1. Read the file(s) you are about to modify
2. Understand the existing patterns in that file
3. Follow the same patterns (naming, error handling, response format)
4. Run `npm run build` after changes to catch TypeScript errors
5. Run `npm run lint` to check for lint issues

## After Every Change

1. Verify the build passes: `npm run build`
2. If you modified an API route, test it with curl or describe how to test
3. If you modified a page, describe what changed visually
4. If you added an env var, update `.env.example`
5. If you added a new external domain, update CSP in middleware
6. Commit with conventional commits: `feat:`, `fix:`, `chore:`, `perf:`, `a11y:`, `security:`

## Content Writing Rules (for any user-facing text)

- Clear, simple language. Short sentences. Active voice.
- Use "you/your" to address the reader.
- No em dashes (use commas or periods).
- BANNED WORDS: can, may, just, that, very, really, literally, actually, certainly, probably, basically, could, maybe, delve, embark, enlightening, esteemed, shed light, craft/crafting, imagine, realm, game-changer, unlock, discover, skyrocket, abyss, not alone, in a world where, revolutionize, disruptive, utilize, dive deep, tapestry, illuminate, unveil, pivotal, intricate, elucidate, hence, furthermore, however, harness, exciting, groundbreaking, cutting-edge, remarkable, remains to be seen, glimpse into, navigating, landscape, stark, testament, in summary, moreover, boost, skyrocketing, opened up, powerful, inquiries, ever-evolving.