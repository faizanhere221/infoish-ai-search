# Infoishai — Project Summary

Generated for a production-readiness audit. Path: `F:\infoishai-fresh`. Generated 2026-10-12.

---

## 1. Tech Stack

**Framework:** Next.js `14.2.35` (App Router), React `18.3.1` / React DOM `18.3.1`, TypeScript `5.9.3`.

**Database/Backend:** `@supabase/supabase-js@2.112.3`, `@supabase/ssr@0.5.2` — Postgres via Supabase. **Not actually using Supabase Auth** (see §8).

**Styling:** `tailwindcss@3.4.19`, `@tailwindcss/forms@0.5.11`, `@tailwindcss/typography@0.5.20`, `tailwind-merge@2.6.1`, `class-variance-authority@0.7.1`.

**Auth/Crypto:** `jose@6.2.10` (JWT verify, used in middleware), `jsonwebtoken@9.0.3` (JWT sign, used in API routes), `bcryptjs@3.0.3` (password hashing).

**Validation/Forms:** `zod@3.25.76`, `react-hook-form@7.86.0`.

**Icons/UI:** `lucide-react@0.400.0`.

**Utility:** `date-fns@3.6.0`, `clsx@2.1.1`.

**Listed but NOT actually used anywhere in `src/`** (confirmed via grep — see §17 for detail): `@prisma/client@7.9.1` (`src/lib/prisma.ts` is an explicit stub: `export const prisma = null`), `pg@8.23.0` (a parallel raw-Postgres pool in `src/lib/database/connection.ts`, never imported), `@stripe/stripe-js@4.10.0` and `stripe@16.12.0` (zero Stripe API calls or `/api/stripe/*` routes anywhere).

**Dev tooling:** ESLint `8.57.1` (`eslint-config-next`, `@typescript-eslint`, `react-hooks`), Prettier (no semicolons, single quotes, 100-char width, `prettier-plugin-tailwindcss`). **No test runner configured** — no Jest/Vitest/Playwright/Cypress, no `test` script in `package.json`.

**Scripts:** `dev` (`next dev`), `build` (`next build` — also runs the TS check), `start` (`next start`), `lint` (`next lint`). No `type-check` script despite one being referenced in `reame.md`.

---

## 2. Project Structure

Full tree (`find . -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/.git/*'`, truncated to first 300 entries as requested — repo has 604 entries total excluding those three directories):

```
.
.env
.env.example
.env.local
.eslintrc.json
.gitignore
.prettierignore
.prettierrc
AUDIT_REPORT.md
CHANGELOG.md
CLAUDE.md
README.md
TODO.md
components.json
data/
data/contact-submissions.json
data/newsletter-subscriptions.json
data/payment-submissions.json
docs/
docs/REFERRAL_SYSTEM.md
full_dump.sql
next-env.d.ts
next.config.js
package-lock.json
package.json
postcss.config.js
public/
  3bd5616de61c4aa694ca4c2708a83c69.txt
  apple-touch-icon.png, demo-video.mp4, favicon.ico/.svg/.zip, favicon-96x96.png
  file.svg, globe.svg, next.svg, vercel.svg, window.svg
  google9b21ca159a20a693.html
  hero-image.png, images/hero-image.png, images/logo.png, images/team/*.jpg|.jpeg
  llms.txt, logo.png
  manifest.json, site.webmanifest, sw.js
  uploads/payment-proofs/{.gitkeep, 4 real uploaded image files}
  web-app-manifest-192x192.png, web-app-manifest-512x512.png
reame.md                      # typo'd filename — the actually-detailed README; README.md is default create-next-app boilerplate
requirements.txt               # Python/FastAPI deps — leftover from a prior backend, unrelated to this app
scripts/
  Infoishai-Start.bat, README.md, audit.ps1, auto.ps1, auto.sh, blog.ps1
  create_notifications_table.sql, deploy.ps1, evening.ps1, feature.ps1
  fix-errors.ps1, github-actions/daily-automation.yml, morning.ps1, seo.ps1
  setup.ps1, startup.ps1, weekly.ps1
src/
  app/                         # Next.js App Router — see §3
  components/                  # see §5
  config/product.ts
  hooks/                       # index.ts, useAuth.tsx, useBrand.ts, useCreator.ts, useDeals.ts, useMessages.ts, usePartner.ts
  lib/
    activity.ts, ai/claude.ts (empty), ai/openai.ts (empty), analytics.ts
    auth/config.ts (empty file)
    database/connection.ts (unused pg pool), database/models.ts (unused), database/seed.ts
    db.ts                      # the REAL Supabase client factory — createServerSupabase()
    notifications.ts, prisma.ts (stub), profile-completion.ts, rate-limit.ts
    referral-commissions.ts, referral-tracking.ts, referral.ts
    social/instagram.ts (empty), social/tiktok.ts (empty), social/youtube.ts (empty)
    supabase.ts                # anon-key client
    utils.ts
  middleware.ts
  types/campaigns.ts, database.ts, google.d.ts, marketplace.ts, referral.ts
  types.d.ts
  utils/admin.ts, auth.ts, constants.ts, imageCompression.ts, validateEmail.ts
supabase/
  activity_migration.sql, admin_migration.sql, campaigns_migration.sql
  creator_profile_views_migration.sql   # explicitly NOT applied to the live DB yet — see §7
  deals_services_fix_migration.sql, migration.sql, newsletter_contact_migration.sql
  referral_system_migration.sql, schema.sql, settings_migration.sql
tailwind.config.js
tsconfig.json
tsconfig.tsbuildinfo
vercel.json
```

**Noise/dead files at repo root, not part of the real app:** `requirements.txt` (FastAPI/Pinecone/OpenAI Python deps), `TODO.md` (references Python files like `hybrid_search_service.py`/`main.py` that don't exist in this repo), `full_dump.sql` (0 bytes), `AUDIT_REPORT.md`/`CHANGELOG.md` (not inspected in depth for this summary). These are remnants of a prior, unrelated project iteration — see §17.

---

## 3. All Pages/Routes (82 page.tsx files)

Full route-by-route audit (metadata/images/h1/forms/CTAs) is in **§10**. Route list by section:

**Public marketing:** `/` (page.tsx + components/landing/index.tsx), `/about`, `/contact`, `/help`, `/privacy`, `/terms`.

**Auth:** `/login`, `/signup`, `/signup/brand`, `/signup/creator`, `/forgot-password`, `/auth/callback` (route-group `(auth)` doesn't affect the URL).

**Country/SEO landing pages (9):** `/influencers/{usa,uk,canada,india,pakistan,australia,germany,netherlands,singapore}`.

**Tools (3):** `/tools`, `/tools/instagram-hashtag-generator`, `/tools/instagram-profile-analyzer`.

**Blog (19):** `/blog` index + 18 posts (slugs match the `src/app/blog/*` directory names).

**Creators:** `/creators`, `/creators/[username]`.

**Campaigns (5):** `/campaigns`, `/campaigns/[id]`, `/campaigns/[id]/apply`, `/campaigns/[id]/edit`, `/campaigns/create`.

**Dashboard (12, all noindexed):** `/dashboard/brand`, `/dashboard/creator`, `/dashboard/partner`, `/dashboard/applications`, `/dashboard/applications/[id]`, `/dashboard/campaigns`, `/dashboard/campaigns/[id]/applications`, `/dashboard/campaigns/[id]/applications/[applicationId]`, `/dashboard/deals`, `/dashboard/deals/new`, `/dashboard/deals/[id]`, `/dashboard/deals/[id]/review`.

**Messages/Notifications (3, noindexed):** `/messages`, `/messages/[id]`, `/notifications`.

**Settings (2, noindexed):** `/settings`, `/settings/brand`.

**Admin (15, noindexed):** `/admin/login`, `/admin/dashboard`, `/admin/users`, `/admin/creators`, `/admin/brands`, `/admin/deals`, `/admin/partners`, `/admin/partners/[id]`, `/admin/analytics`, `/admin/activity`, `/admin/search`, `/admin/contacts`, `/admin/newsletter`, `/admin/admins`, `/admin/settings`.

---

## 4. API Routes (75 route.ts files)

### Admin (34 routes)

- `GET /api/admin/activity` — 20 most recent platform activity items (registrations, deal changes, messages) merged from users/deals/deal_messages.
- `GET /api/admin/activity/export` — exports activity logs as CSV, filterable by action/date range.
- `GET, POST /api/admin/admins` — super-admin only: lists admin/super_admin users, or creates one with a bcrypt-hashed password.
- `PATCH /api/admin/admins/[id]` — super-admin only: updates an admin's role/active status (not self).
- `GET /api/admin/analytics` — platform-wide analytics (registrations, deals, revenue, niches) over a date range.
- `POST /api/admin/auth/login` — rate-limited admin login; verifies admin/super_admin role; issues JWT in httpOnly cookie.
- `POST /api/admin/auth/logout` — clears the admin `auth_token` cookie.
- `GET /api/admin/brands` — paginated/filterable brand list with linked user info.
- `GET, PATCH /api/admin/brands/[id]` — brand profile + recent deals, or update verification/active state.
- `GET /api/admin/contact-submissions` — lists contact-form messages.
- `POST /api/admin/contact-submissions/delete` — deletes a submission.
- `POST /api/admin/contact-submissions/update` — toggles read/unread.
- `GET /api/admin/creators` — paginated/filterable creator list with user status + platforms.
- `GET, PATCH /api/admin/creators/[id]` — creator profile detail, or update verification/availability/featured/active flags.
- `POST /api/admin/creators/[id]/feature` — toggles `is_featured`, logs action.
- `POST /api/admin/creators/[id]/verify` — sets verification status, logs action.
- `GET /api/admin/deals` — paginated/filterable deal list enriched with brand/creator names.
- `GET, PATCH /api/admin/deals/[id]` — deal detail, or update status/amount/currency/notes with activity logging.
- `GET, DELETE /api/admin/newsletter-subscriptions-new` — lists/deletes newsletter subscribers.
- `GET, POST /api/admin/partners` — lists referral partners with live earnings, or creates a new partner.
- `GET, PUT, DELETE /api/admin/partners/[id]` — partner detail, update, or soft-delete (deactivate).
- `GET, PUT /api/admin/partners/[id]/commissions` — lists commissions, or approves/cancels one.
- `GET, POST /api/admin/partners/[id]/payouts` — lists payouts, or records a new one.
- `GET /api/admin/partners/[id]/referrals` — lists a partner's referral signups.
- `GET /api/admin/search` — cross-entity search (users/creators/brands/deals).
- `GET, PATCH /api/admin/settings` — platform settings (super-admin for writes).
- `GET /api/admin/stats` — dashboard overview counts/trends/distributions.
- `GET /api/admin/users` — paginated/filterable user list.
- `GET /api/admin/users/export` — exports filtered user list as CSV.
- `GET, PATCH, DELETE /api/admin/users/[id]` — user detail, update (role change super-admin only), or delete.
- `POST /api/admin/users/[id]/activate` — reactivates a suspended user.
- `GET /api/admin/users/[id]/activity` — paginated activity history for a user.
- `POST /api/admin/users/[id]/impersonate` — super-admin only: issues short-lived impersonation JWT.
- `POST /api/admin/users/[id]/suspend` — deactivates a user.

### Auth (2)

- `POST /api/auth/login` — rate-limited; verifies credentials, updates last-login, loads profile, issues JWT.
- `POST /api/auth/register` — rate-limited; validates input, hashes password, creates user, logs event.

### Creators (6)

- `GET, POST /api/creators` — search/filter/paginate creators, or create a profile (with optional platforms + referral linking).
- `GET, PUT /api/creators/[id]` — fetch by id/user_id/username, or update own profile.
- `POST /api/creators/[id]/avatar` — uploads profile photo to Supabase storage (owner only).
- `GET, PUT, DELETE /api/creators/[id]/platforms` — list, replace full set (owner, recalculates followers), or delete one.
- `GET, PUT /api/creators/[id]/services` — list active services, or replace full list (owner, delete-then-insert).
- `POST /api/creators/[id]/view` — increments public profile view counter (no auth required).

### Brands (2)

- `GET, POST /api/brands` — list public brand fields, or create a profile for the authenticated user.
- `GET, PUT /api/brands/[id]` — fetch public profile, or update (owner only).

### Deals (7)

- `GET, POST /api/deals` — list caller's deals, or create one (10% platform fee, notifies creator).
- `GET, PUT /api/deals/[id]` — fetch with relations, or update limited fields (either party).
- `POST /api/deals/[id]/accept` — creator accepts, system message + brand notified.
- `POST /api/deals/[id]/approve` — brand approves delivery → completed; calculates referral commission; updates lifetime stats.
- `POST /api/deals/[id]/decline` — creator declines a pending deal.
- `POST /api/deals/[id]/deliver` — creator submits delivery (requires all deliverables checked).
- `POST /api/deals/[id]/revision` — brand requests a revision (up to the allowed limit).

### Campaigns (7)

- `GET, POST /api/campaigns` — list (owner's own in any status, else published only), or create a draft.
- `GET, PUT, DELETE /api/campaigns/[id]` — fetch, update, delete draft / soft-cancel published.
- `POST /api/campaigns/[id]/close` — owner closes to new applications.
- `POST /api/campaigns/[id]/publish` — owner publishes/reopens after required-field validation.
- `GET, POST /api/campaigns/[id]/applications` — owner lists applications, or creator applies.
- `PUT /api/campaigns/[id]/applications/[applicationId]` — owner updates status, notifies creator.
- `POST /api/campaigns/[id]/applications/[applicationId]/message` — owner starts/reuses a conversation with the applicant.

### Applications (2)

- `GET, DELETE /api/applications/[id]` — creator views own application, or withdraws it (while "submitted").
- `GET /api/applications` — creator's own applications, filterable.

### Messages/Conversations (4)

- `GET, POST /api/conversations` — list caller's conversations, or find/create one.
- `GET, DELETE /api/conversations/[id]` — fetch with history, or delete (party only).
- `GET, POST /api/conversations/[id]/messages` — list messages (optionally mark-read), or send one.
- `GET, POST, PATCH /api/messages` — cursor-paginated fetch; send (flags possible contact-info sharing); or mark read.

### Notifications (1)

- `GET, POST, PATCH /api/notifications` — list with unread count, create (internal use), or mark read.

### Referral (7)

- `GET /api/referral/commissions` — current partner's commissions.
- `GET /api/referral/lookup` — public: validates a referral code, returns partner name.
- `GET /api/referral/me` — current user's own partner record (403 if not a partner).
- `GET /api/referral/payouts` — current partner's payouts.
- `GET /api/referral/referrals` — current partner's referral signups.
- `GET /api/referral/stats` — current partner's dashboard stats.
- `POST /api/referral/track` — public: records a referral signup against a code.

### Reviews (1)

- `GET, POST /api/reviews` — paginated public reviews for a creator, or submit a review (recalculates rating).

### Misc (2)

- `POST /api/contact` — validates/stores a contact-form submission.
- `POST /api/indexnow` — submits site URLs to the IndexNow API for re-crawl.

---

## 5. Components (66 .tsx files under src/components/)

### Top-level
- `header.tsx` — public-site header: logo, nav (About, Tools/Countries dropdowns, Blog), auth-aware login/signup or profile dropdown, mobile menu.
- `footer.tsx` — public-site footer: newsletter form, contact info, link columns, social links.
- `DashboardHeader.tsx` — sticky logged-in header with brand/creator nav (unread badges), notifications, ProfileDropdown; polls unread counts every 5s.
- `ProfileDropdown.tsx` — shared avatar/dropdown menu (profile, dashboard, messages, deals, partner dashboard, settings, sign out).
- `NewsletterForm.tsx` — email signup with inline typo-check validation, posts to `/api/newsletter/subscribe`.
- `TeamSection.tsx` — static "Meet the Team" cards.
- `AvatarUpload.tsx` — drag-and-drop avatar uploader with client-side resize, immediate or deferred upload modes.

### applications/
- `ApplicationStatusBadge.tsx` — status pill (submitted/viewed/shortlisted/rejected/hired).
- `ApplicationForm.tsx` — creator's campaign application form.
- `ApplicantCard.tsx` — brand-facing applicant card with shortlist/hire/reject/message actions.
- `ApplicationCard.tsx` — creator's own application summary card.

### campaigns/
- `CampaignList.tsx` — grid of CampaignCards (creator/brand variant), loading/empty states.
- `CampaignManagementCard.tsx` — brand campaign card with status/counts and manage actions.
- `DeliverableForm.tsx` — single deliverable row editor.
- `WizardStepIndicator.tsx` — multi-step progress indicator.
- `CampaignWizard.tsx` — 5-step campaign create/edit wizard (Basics/Requirements/Deliverables/Budget/Review).
- `CampaignFilters.tsx` — campaign search/filter bar.
- `CampaignCard.tsx` — renders CreatorCampaignCard or BrandCampaignCard by variant.
- `CampaignDetail.tsx` — full campaign detail body with role-specific action panels.
- `steps/Step1Basics.tsx` … `Step5Review.tsx` — the 5 wizard step forms.

### creator/
- `ServicesList.tsx`, `PortfolioGrid.tsx` (with lightbox modal), `CreatorCard.tsx` (grid/list variants).

### dashboard/
- `DashboardLayout.tsx` — sidebar+topbar shell.
- `StatsCard.tsx`, `DealCard.tsx`, `DashboardStats.tsx` (profile views/followers).
- `OnboardingWizard.tsx` — dismissible creator onboarding (avatar→bio→platforms→rates).
- `CreatorPlatforms.tsx`, `CreatorServices.tsx`, `ProfileCompletionCard.tsx` (with localStorage-persisted dismissal).

### deals/
- `DealStatus.tsx` — status display with timeline/revision warnings.
- `CreateDealForm.tsx` — brand's deal-creation modal with fee calculation.

### landing/index.tsx (single file, 18 named exports)
`Navigation`, `HeroSection`, `AboutSection`, `HowInfoishaiWorksSection`, `ForBrandsSection`, `ForCreatorsSection`, `ProblemSection`, `SolutionSection`, `PlatformSection`, `CategoriesSection`, `HowItWorksSection`, `WhyMarketplaceSection`, `UseCasesSection`, `FAQSection`, `FinalCTASection`, `NewsletterSection`, `Footer` — the entire homepage/about-page UI.

### marketplace/
- `CreatorGrid.tsx` — grid/list toggle of CreatorCards.
- `SearchFilters.tsx` — full creator search/filter panel (desktop sidebar + mobile slide-over).

### messaging/
- `MessageInput.tsx`, `ConversationList.tsx`, `ChatThread.tsx`.

### partner/
- `PartnerStatsCard.tsx`, `ReferralTable.tsx`, `CommissionTable.tsx` (reused by admin), `PayoutTable.tsx`, `CopyReferralLink.tsx`.

### referral/
- `ReferralBanner.tsx` — "referred by" banner on signup.

### admin/
- `DataTable.tsx` — generic sortable/selectable table.
- `PartnerStats.tsx`, `RecordPayoutModal.tsx`, `PartnerTable.tsx`, `AddPartnerModal.tsx`, `LinkUserModal.tsx`.

### influencers/
- `{Australia,Canada,Germany,India,Netherlands,Pakistan,Singapore,Uk,Usa}Faq.tsx` — 9 country-specific FAQ accordions.

### seo/
- `GoBackButton.tsx`, `JsonLd.tsx` (`OrganizationJsonLd`, `WebSiteJsonLd`, `SoftwareApplicationJsonLd`).

---

## 6. Environment Variables (names only)

**Actually used in code** (`grep process.env`): `JWT_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (only by the unused `lib/database/connection.ts`), `NEXT_PUBLIC_BACKEND_URL` (only by the dead `/auth/callback` page — see §17), `NODE_ENV`.

**Listed in `.env.example` but NOT referenced anywhere in `src/`:** `OPENAI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT`, `PINECONE_INDEX_NAME`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL`.

**Present in `.env` / `.env.local` but not in `.env.example` and not referenced in `src/`:** `BACKEND_URL`, `INTERNAL_API_KEY`, `VALID_API_KEYS`, `ADMIN_TOKEN`, `BANK_ACCOUNT_TITLE`, `BANK_ACCOUNT_NUMBER`, `BANK_NAME`, `BANK_IBAN`, `BANK_BRANCH_CODE`, `SMTP_SERVER`, `SMTP_PORT`, `SMTP_EMAIL`, `SMTP_PASSWORD`, `SMTP_FROM_NAME`.

`.env.example` is significantly out of sync with both what the code actually needs (`JWT_SECRET` isn't listed) and what's actually configured (bank/SMTP vars aren't documented at all).

---

## 7. Database

25 tables across `supabase/schema.sql` (base, 14 tables) + 9 migration files (no migration runner — this is the cumulative true schema).

**Core marketplace (schema.sql):** `users`, `creators`, `creator_platforms`, `creator_services`, `creator_portfolio`, `brands`, `deals`, `deal_messages`, `conversations`, `messages`, `reviews`, `notifications`, `saved_creators`, `payments`.

**Campaigns (campaigns_migration.sql):** `campaigns`, `campaign_deliverables`, `campaign_applications`.

**Referral system (referral_system_migration.sql):** `referral_partners`, `referral_signups`, `referral_commissions`, `referral_payouts`.

**Admin/ops:** `activity_logs` (activity_migration.sql), `platform_settings` (settings_migration.sql), `contact_messages` + `newsletter_subscribers` (newsletter_contact_migration.sql).

**Column-level notes worth flagging:**
- `users.role` (admin_migration.sql) — `'user' | 'admin' | 'super_admin'`, drives all admin-route authorization.
- `creators.profile_views` (creator_profile_views_migration.sql) — **the migration file explicitly says this has NOT been applied to the live database yet** (blocked by a permission classifier during an earlier session). The dashboard "Profile Views" stat and `POST /api/creators/[id]/view` likely no-op or error against production until someone runs this migration manually.
- `deals.deliverables` was changed from `TEXT[]` to `JSONB` (deals_services_fix_migration.sql) to hold `{id, description, is_completed}` objects.
- `referral_commissions.commission_rate` applies to Infoishai's own platform fee (5%, see `PLATFORM_FEE_RATE` in `src/lib/referral-commissions.ts`), not to the raw deal amount — a partner's "20% commission" is 20% of the platform's cut.

**RLS:** `schema.sql` enables RLS on all 14 base tables and defines ~27 policies; `migration.sql`/`referral_system_migration.sql`/`campaigns_migration.sql`/`newsletter_contact_migration.sql` add more (39 + 27 + 8 + 6 + 2 = ~82 policy statements total across the files). **Important: every policy is written against Supabase Auth's `auth.uid()`** (e.g. `USING (auth.uid() = user_id)`), but the app does not use Supabase Auth at all (see §8) — see §14 for why this makes RLS non-functional as a real access-control layer in this app's actual architecture.

---

## 8. Authentication

**Not Supabase Auth, not OAuth-in-practice, not magic links.** Custom JWT-based auth:

1. `POST /api/auth/register` / `POST /api/auth/login` validate credentials directly against the `users` table (bcrypt, cost 12), issue a JWT (`jsonwebtoken`) containing `userId`/`userType`/`profileId`/`role`, and return it in both the response body and an `auth_token` cookie.
2. `src/middleware.ts` verifies the JWT (via `jose`) on every `/api/*` and `/admin/*` request, from either the `Authorization: Bearer` header or the cookie. On success it **injects** trusted `x-user-id`/`x-user-type`/`x-profile-id`/`x-user-role` headers onto the request (first stripping any client-supplied versions of those same headers, so a caller can't spoof them). API routes read identity exclusively from these headers.
3. `/admin/*` page routes and `/api/admin/*` routes additionally require `role === 'admin' | 'super_admin'`.
4. Client-side, components read `localStorage` (`auth_token`, `auth_user`, `auth_profile`) directly — there's a fully-built `AuthProvider`/`useAuth()` context in `src/hooks/useAuth.tsx`, but **it is never mounted anywhere in the app**; 26+ components bypass it and read localStorage inline instead.
5. "Sign in with Google" exists as a button in `header.tsx`, but `handleGoogleLogin()` is a stub that just does `router.push('/login')` — it does not trigger any real OAuth flow. See §17 for the separate, also-dead `/auth/callback` page.

---

## 9. Current Metadata (root layout)

`src/app/layout.tsx` sets a sitewide default via `metadataBase`, a title template (`%s | Infoishai`), description, keywords, full `openGraph` + `twitter` blocks, `robots` (index/follow + googleBot directives), `icons` (favicon.ico, apple-touch-icon.png — both real files), `manifest: '/site.webmanifest'`, and a Google Search Console verification meta tag. It also renders `OrganizationJsonLd`, `WebSiteJsonLd`, and `SoftwareApplicationJsonLd` (from `src/components/seo/JsonLd.tsx`) on every page.

**Two concrete bugs found here:**
- `openGraph.images` points at `https://infoishai.com/og-image.jpg` and `twitter.images` at `.../twitter-image.jpg` — **neither file exists anywhere in `public/`.** Every social share of any page that doesn't override these (most pages do override per-page, but the root fallback is broken) will show a broken preview image.
- `manifest: '/site.webmanifest'` points at the file that's actually referenced, but its contents are untouched template boilerplate: `"name": "MyWebSite"`, `"short_name": "MySite"`. A separate `public/manifest.json` has old pre-rebrand content (`"name": "Pakistani Influencer Search"`) and isn't linked from anywhere.

---

## 10. Existing Pages Content Audit

Full per-route table (metadata/images+alt/h1/forms/CTAs for all 82 pages) was produced during this audit; the high-signal findings from it:

1. **Missing `<h1>` on 4 real, indexable pages:** `/signup/brand`, `/signup/creator`, `/forgot-password` (only `<h2>` present — confirmed by reading the full files, not a child-component illusion), and `/auth/callback` (low priority, noindexed, transient).
2. **No page-specific `<title>` across nearly all of `/admin/*`** (13 of 15 routes) because `admin/layout.tsx` is a client component and can't export metadata — every admin tab shows the generic sitewide title. Noindexed, so zero SEO impact, but a real internal-tool UX gap.
3. **Generic "Dashboard"/"Settings"/"Messages" tab titles** across nearly all `/dashboard/*`, both `/settings/*`, and both `/messages/*` routes — only `/dashboard/partner` and the dynamic admin-partner pages override the generic parent-layout title.
4. **`/campaigns/create` has no detectable `<form>`/`onSubmit`/field-level state** in the page file itself — worth a manual follow-up since it's a primary conversion page (the actual form logic may live in `CampaignWizard.tsx`, which the page renders).
5. **Two pages use plain `<img>` instead of `next/image`:** `/dashboard/creator` and `/dashboard/campaigns/[id]/applications/[applicationId]` — alt text is fine on both, but they lose Next.js image optimization.
6. **Zero images across all 19 blog routes** — pure text, no hero/featured images anywhere in the blog.
7. **Settings pages use `onClick={handleSave}` on a plain button, not a semantic `<form onSubmit>`** (`/settings`, `/settings/brand`, likely `/admin/settings`) — functional, but no Enter-to-submit and weaker accessibility semantics.
8. **Everything else checks out well:** every page that does render an image has meaningful, context-aware alt text (names, roles, company names, or sensible fallbacks) — no empty or generic `alt` attributes found anywhere. All 18 blog posts, all 9 country pages, and all core marketing pages have complete metadata with OG/Twitter cards. `robots.ts` correctly disallows the non-public sections.

---

## 11. Static Assets (public/)

Real assets: `logo.png` (+ duplicate under `images/`), `hero-image.png` (+ duplicate under `images/`), `images/team/*.jpg|.jpeg` (4 team photos, 2 named + 2 UUID-named), `demo-video.mp4`, `apple-touch-icon.png`, `favicon.ico`/`.svg`/`.zip`, `favicon-96x96.png`, `web-app-manifest-{192,512}x192.png`, `llms.txt`, default Next.js/Vercel SVG placeholders (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` — never customized, likely unused).

**Verification/config files:** `google9b21ca159a20a693.html` (Search Console ownership verification), `3bd5616de61c4aa694ca4c2708a83c69.txt` (another domain-ownership verification token).

**Service worker:** `sw.js` exists but is never registered anywhere in the app (`navigator.serviceWorker.register` not found) — dead file.

**Two manifests, only one wired up** — see §9.

**⚠️ `public/uploads/payment-proofs/`** contains 4 real uploaded image files (`.webp`/`.png`/`.jpg`), **committed to git**, served as plain static files with no authentication. See §14 for the security implication.

---

## 12. Middleware

Single `src/middleware.ts`, matcher `['/api/:path*', '/admin/:path*']`. Handles two concerns:

- **Admin pages** (`/admin/*`, except `/admin/login`): redirects to `/admin/login` unless a valid JWT cookie with `role` of `admin`/`super_admin` is present.
- **API routes** (`/api/*`): public routes (`/api/auth/*`, `/api/admin/auth/*`, `GET /api/creators`, `GET /api/brands`, newsletter/contact POSTs, referral lookup/track, `POST /api/creators/[id]/view`) pass through unauthenticated. `GET /api/campaigns` and `GET /api/campaigns/[id]` are **optional-auth** — a present token is verified and trusted, a missing/invalid one falls through as anonymous (never trusting raw client headers directly). Everything else requires a valid JWT; `/api/admin/*` additionally requires the admin role. On success, it strips any client-supplied `x-user-*` headers and injects its own verified ones.

No CSP, HSTS, X-Frame-Options, or other security headers are set anywhere (middleware or `next.config.js`) — see §14.

---

## 13. Third-Party Services

- **Analytics:** Google Analytics 4, via a `gtag.js` `<Script>` tag in `layout.tsx` (measurement ID `G-Y97NRDZSBB`) plus a real wrapper module `src/lib/analytics.ts` (event helpers like `trackSignupComplete`, `trackLogin`, `identifyUser`), used in `auth/callback/page.tsx` and `contact/page.tsx`.
- **Error tracking:** none (no Sentry/Bugsnag/LogRocket or similar — errors go to `console.error` only, 277 call sites).
- **Email:** `.env` has `SMTP_*` variables configured, but no code anywhere in `src/` sends email (no nodemailer/SMTP client import found) — likely unused/aspirational, or handled by a separate service not in this repo.
- **Payments:** Stripe SDKs are installed but completely unused (see §1, §17). `.env`/`.env.local` instead have `BANK_ACCOUNT_*` variables and a `payment-proofs` upload directory, suggesting the real payment flow (if any is live) is manual bank transfer + screenshot upload, not Stripe.
- **AI/Search:** `OPENAI_API_KEY`/`PINECONE_*` are configured but unused; `src/lib/ai/claude.ts` and `src/lib/ai/openai.ts` are empty files. "AI-powered" language in the marketing copy refers to the search/filter UX, not a real AI backend call.
- **Cron:** `vercel.json` schedules a daily hit to `/api/cron/check-expired-subscriptions` — **this route does not exist**, so this cron job 404s every day in production (see §16).

---

## 14. Current Security

**Exposed secrets in client code:** none found — no `NEXT_PUBLIC_`-unprefixed secret/key pattern appears inside any `'use client'` component.

**HTTPS:** not explicitly enforced in app code; relies entirely on the hosting platform (Vercel enforces HTTPS/TLS at the edge by default for `*.vercel.app` and custom domains with a valid cert — not something this repo configures itself).

**Security headers:** none configured anywhere — no CSP, no `Strict-Transport-Security`, no `X-Frame-Options`/`X-Content-Type-Options`. Not fatal (Vercel sets some baseline headers), but there's no explicit hardening.

**XSS:** the only `dangerouslySetInnerHTML` usages in the entire codebase are JSON-LD `<script>` tags built with `JSON.stringify()` on server-controlled data — no raw-HTML/user-content injection risk found.

**SQL injection:** no raw string-interpolated queries found; the one place that builds raw SQL (`src/lib/database/connection.ts`) is dead/unused code.

**Password handling:** bcrypt, cost factor 12, on both register and login — solid.

**Rate limiting:** implemented (`src/lib/rate-limit.ts`) and applied to the three most sensitive routes — `/api/auth/login`, `/api/auth/register`, `/api/admin/auth/login`. **However, it's a plain in-memory `Map`**, which does not work correctly across multiple serverless function instances/cold starts on Vercel (the deployment target per `vercel.json`) — in production this rate limiting is likely inconsistent or effectively bypassable, since each invocation may land on a fresh instance with an empty store.

**⚠️ Row Level Security is effectively decorative in this architecture.** The entire RLS policy set across `schema.sql` and the migrations is written against Supabase Auth's `auth.uid()` (e.g., `creators_update ON creators FOR UPDATE USING (auth.uid() = user_id)`). But every API route uses `createServerSupabase()` with the **service-role key**, which bypasses RLS entirely by design — and there is no real Supabase Auth session anywhere in this app (see §8), so `auth.uid()` would always evaluate to `NULL` even if RLS were ever enforced via the anon-key client. In practice, **all real authorization happens at the Next.js API route layer** (the `x-user-id`/`x-profile-id` headers set by middleware), not at the database layer. This is fine as long as every single write path goes through the Next.js app and the service-role key never leaks — but it means the database itself has no independent defense-in-depth if that assumption is ever violated.

**⚠️ PII and payment data committed to git.** `data/contact-submissions.json`, `data/newsletter-subscriptions.json`, and `data/payment-submissions.json` are tracked in the repository (not gitignored) and contain real-shaped records (e.g. a `user_email` field, payment references, file paths). Nothing in `src/` currently reads or writes these files — they appear to be a flat-file "database" from an earlier iteration of the project that was abandoned in favor of the Supabase tables, but the historical data is still sitting in git. Related: `public/uploads/payment-proofs/` contains 4 real uploaded payment-proof images, also committed to git and served as unauthenticated static files — anyone with the URL (or repo access) can view them.

---

## 15. Performance

**Images:** `next.config.js` whitelists two remote image hosts for `next/image` optimization — `lh3.googleusercontent.com` (Google OAuth avatars, for a feature that isn't actually wired up — see §8) and the project's Supabase storage domain (`ypdspiwxsojwjzbagaip.supabase.co`, for creator/brand avatars and portfolio media). Most of the app correctly uses `<Image>`; two dashboard pages use plain `<img>` instead (§10).

**Bundle:** no explicit `optimizePackageImports`, no bundle analyzer configured. `lucide-react` is imported per-icon by name throughout (tree-shakeable). No obviously oversized barrel imports spotted during this audit, but a dedicated bundle-size pass wasn't run.

**Caching/ISR:** no `revalidate` exports or `fetch` cache config found on blog/country pages — they're likely fully static at build time by default (no dynamic per-request data), which is good for performance but means content changes require a redeploy.

---

## 16. Deployment

`vercel.json` contains only a cron entry:
```json
{ "crons": [{ "path": "/api/cron/check-expired-subscriptions", "schedule": "0 0 * * *" }] }
```
**This route doesn't exist anywhere in `src/app/api/`** — the cron will hit a 404 daily once deployed. Either the route was removed without updating `vercel.json`, or this is leftover config from a feature (subscription expiry) that was never built.

No `redirects()` or `rewrites()` in `next.config.js`. `src/app/robots.ts` (dynamic, not a static `public/robots.txt`) correctly disallows `/api/`, `/admin/`, `/dashboard/`, `/messages/`, `/settings/`, `/notifications/`, `/auth/callback`, `/campaigns/create`, and `/creators?*` query params, and explicitly allows/blocks the major AI crawlers (OAI-SearchBot, PerplexityBot, Claude-SearchBot, Applebot, Google-Extended allowed; GPTBot, CCBot, anthropic-ai blocked). `src/app/sitemap.ts` is dynamic and includes all public marketing/country/blog/tool pages plus every verified creator profile (up to 5,000).

---

## 17. Known Issues

**No `TODO`/`FIXME` comments anywhere in `src/`** — either genuinely clean, or they were resolved in prior cleanup passes (git history shows a dedicated "resolve all ESLint warnings" commit).

**Substantial dead/scaffolded code**, all confirmed unused via grep (zero import sites outside their own file):
- `src/lib/prisma.ts` — explicit stub (`export const prisma = null`); `@prisma/client` is installed but nothing uses it.
- `src/lib/database/connection.ts` + `models.ts` — a parallel raw-`pg`-Pool database layer, fully unused; the real data layer is `src/lib/db.ts`'s `createServerSupabase()`.
- `src/lib/auth/config.ts` — empty file.
- `src/lib/ai/claude.ts`, `src/lib/ai/openai.ts` — empty files (0 lines each).
- `src/lib/social/instagram.ts`, `tiktok.ts`, `youtube.ts` — empty files (0 lines each).
- `src/hooks/useAuth.tsx` — a complete `AuthProvider`/`useAuth()` context, never mounted; `useCreator.ts`, `useBrand.ts`, `useDeals.ts`, `useMessages.ts` — also unused (only `usePartner.ts` is actually called anywhere).
- `components.json` configures shadcn/ui, but `src/components/ui/` was never created.

**Orphaned auth flow from a prior backend.** `src/app/auth/callback/page.tsx` posts to `https://infoish-ai-search-production.up.railway.app/auth/google/callback` (a Railway-hosted service, not part of this Next.js app), expects a `data.access_token`/`data.user` shape, stores it under a `user_data` localStorage key (different from the app's real `auth_user`/`auth_profile` convention), and redirects to `/search` — **a route that doesn't exist in this app.** Combined with `requirements.txt` (FastAPI/Pinecone/OpenAI Python deps), the unused `PINECONE_*`/`OPENAI_API_KEY` env vars, and the stub `handleGoogleLogin()` in `header.tsx`, this is all leftover from an earlier Python/FastAPI + vector-search backend that the project migrated away from. None of it was cleaned up, and the Google-login button currently visible to users doesn't do anything Google-related.

**Concrete, fixable bugs found during this audit** (cross-referenced from earlier sections):
- Root-layout OG/Twitter preview images (`og-image.jpg`, `twitter-image.jpg`) don't exist — broken social-share previews on any page using the root fallback (§9).
- Active PWA manifest (`site.webmanifest`) has unedited placeholder content (`"MyWebSite"`/`"MySite"`) — would show wrong branding if anyone adds the site to their home screen (§9).
- `vercel.json`'s daily cron job targets a non-existent API route (§16).
- `creators.profile_views` migration was never applied to the live database (§7) — the Profile Views stat is likely broken in production right now.
- In-memory rate limiting won't hold up reliably on Vercel's serverless runtime (§14).
- RLS policies reference `auth.uid()`, which never resolves in this app's actual (non-Supabase-Auth) auth model — the database has no real independent access control, only the API layer does (§14).
- Real user/payment data sitting in git-tracked flat files and an unauthenticated public upload directory (§14).
