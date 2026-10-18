# Admin Back Office — Read-Only Audit

Covers every page under `/admin/*` and every route under `/api/admin/*` (15
pages, 33 routes) as of this writing. No code was changed to produce this —
pure reading, plus live `information_schema` checks via `psql` and
`npm run check:schema`. Where a finding depends on live database state, that
state is noted explicitly, since two migrations
(`supabase/phase6a_notifications_migration.sql`,
`supabase/phase6b_email_migration.sql`) have been applied since earlier
audits this session, and one (`supabase/drift_fix_migration.sql`) has not.

**Live right now:** `campaign_contracts`, `creator_deliverables`,
`creator_payments`, `payout_methods`, `campaign_share_links`,
`deliverable_results`, `notifications` (with `category`/`priority`),
`email_log`, `email_daily_usage`, `email_verification_tokens`,
`password_reset_tokens`.

**Not live yet** (fixed by `drift_fix_migration.sql`, not yet run):
`activity_logs`, `platform_settings`, `creators.is_featured`,
`creators.search_vector`, `creator_services.includes`, and 9 columns on
`reviews`.

## 1. Every page and route — what it does, does it work

### Dashboard & reporting

| Page / Route | What it does | Works against live DB? |
|---|---|---|
| `/admin/dashboard` + `GET /api/admin/stats` | KPI cards (user/creator/brand counts, deals by status, 30-day trends, top niches, platform mix, week-over-week %) | **Works.** Queries only `users`/`creators`/`brands`/`deals`/`creator_platforms` — none missing. |
| same page, "recent activity" feed → `GET /api/admin/activity` | Aggregates recent signups + deal status changes + legacy `deal_messages` into one feed | **Works**, but note: this route does **not** read `activity_logs` at all (it builds its feed from `users`/`deals`/`deal_messages` directly) — see §5, this is also dead code from a different angle. |
| `/admin/analytics` + `GET /api/admin/analytics` | Date-range report: registrations/deals/revenue by day, message volume, "Top Actions" panel, CSV export, "PDF" export | **Mostly works.** The "Top Actions" panel reads `activity_logs` (missing) — doesn't crash (Supabase returns `{data:null,error}`, not a throw) but always renders empty, and unlike the sibling route below, this one doesn't check `error.code`, so the failure is invisible even in principle. "PDF export" is literally `window.print()`, not a real PDF — not broken, just worth knowing. |
| `/admin/search` + `GET /api/admin/search` | Cross-entity search (users/creators/brands/deals), CSV export | **Works.** |

### Users & admins

| Page / Route | What it does | Works against live DB? |
|---|---|---|
| `/admin/users` + `GET /api/admin/users` | Full user table: search/filter/sort/paginate, bulk activate/suspend/delete, detail drawer, per-row actions, CSV export | **Works** (list/detail). See §2 and §5 for logging/UI-wiring issues — the mutations work, they just don't log. |
| `GET/PATCH/DELETE /api/admin/users/[id]` | Detail; PATCH `is_active` (any admin) and `role` (super_admin only); DELETE hard-deletes the row | **Works** mechanically. See §2 — DELETE has no super_admin gate and nothing here logs. |
| `POST /api/admin/users/[id]/activate`, `/suspend` | Dedicated, logged activate/suspend | **Works**, but **nothing calls it** — the UI uses the generic PATCH instead (§5). |
| `GET /api/admin/users/[id]/activity` | One user's `activity_logs` history | Table missing — explicitly checks `error.code === '42P01'` and returns `{logs:[], total:0}`. Correctly degrades; always empty until the migration runs. |
| `POST /api/admin/users/[id]/impersonate` + the "Impersonate" button | Mints a 2h JWT for the target user, opens a new tab at `<dashboard>?impersonate=<token>` | **Backend works. End-to-end it does not** — nothing in the app reads the `?impersonate=` query param (checked `src/app/dashboard/**` and everywhere else: zero matches). The new tab just loads the normal dashboard under whatever session is already active in that browser, not the target user's. See §4. |
| `GET /api/admin/users/export` | Real server-side CSV, up to 10,000 rows | **Works, but nothing calls it.** The page's own "Export" button builds a CSV client-side from whatever page of results is currently loaded instead (§5). |
| `/admin/admins` + `GET/POST /api/admin/admins`, `PATCH /api/admin/admins/[id]` | Manage admin/super_admin accounts | **Works.** Fully super_admin-gated, logs correctly. |
| `/admin/login` + `POST/DELETE /api/admin/auth/login`/`logout` | Admin sign-in/out | **Works.** Anti-enumeration, rate-limited, logs successful logins (not failed attempts). |

### Creators, brands, deals

| Page / Route | What it does | Works against live DB? |
|---|---|---|
| `/admin/creators` + `GET /api/admin/creators`, `GET/PATCH /api/admin/creators/[id]` | List/filter/sort/paginate, detail drawer, verify/feature/suspend, CSV export | **List/detail work.** PATCHing `is_featured` 500s (missing column) — the page applies its optimistic UI update anyway without checking `res.ok`, so the badge visibly flips while nothing is saved, then silently reverts on refresh. Verifying (`verification_status`) and suspending work fine (real columns). |
| `POST /api/admin/creators/[id]/feature`, `/verify` | Dedicated, logged feature/verify endpoints | **Orphaned** — nothing calls either; the page PATCHes `/api/admin/creators/[id]` directly instead. `feature` is additionally broken against the live schema and mislabels the failure as 404 "Creator not found" instead of a real error. |
| `/admin/brands` + `GET /api/admin/brands`, `GET/PATCH /api/admin/brands/[id]` | List/filter/sort/paginate, verify/suspend, "Delete Account", CSV export | **Works.** Same blind-optimistic-update pattern as creators, but nothing it PATCHes is missing, so it's cosmetic here, not a live bug. |
| `/admin/deals` + `GET /api/admin/deals`, `GET/PATCH /api/admin/deals/[id]` | List/filter/sort/paginate the **legacy `deals` table only**, CSV export | **Works**, but the PATCH capability (status/amount/currency/notes) isn't wired to any UI — no row click-through exists, so it's unreachable in practice. Strictly the old 1:1 deal flow; see §3 for the campaign-workflow gap. |

### Activity, settings, contacts, newsletter, partners

| Page / Route | What it does | Works against live DB? |
|---|---|---|
| `/admin/activity` | Should show a filterable `activity_logs` table + CSV export | **Completely broken**, independent of the missing table. It fetches `/api/admin/activity/logs` — **that route doesn't exist** (only `/api/admin/activity` and `/api/admin/activity/export` do, neither matching). Every load 404s; the page always shows zero rows. The CSV export button is a client-side dump of whatever's in state, i.e. always just a header row. |
| `GET /api/admin/activity/export` | Real CSV export straight from `activity_logs` | Builds correctly but **nothing calls it** — orphaned, same pattern as users/export and creators/feature+verify. Will also error until `activity_logs` exists. |
| `/admin/settings` + `GET/PATCH /api/admin/settings` | Platform settings (site name, feature toggles, maintenance mode, session/login limits, IP lists) | GET already handles the missing table (`missing_table: true`, falls back to defaults) and loads fine. PATCH already returns a clean 503 "Run settings migration first" rather than crashing — but **no admin has ever been able to save a setting**, since the table has never existed. Will start working the moment the migration runs. No client-side super_admin gate — a plain admin sees the full form and only discovers the 403 after clicking Save. |
| `/admin/contacts` + `GET /api/admin/contact-submissions`, `update`, `delete` | Contact form submissions: filter tabs (all/new/read/**replied**), `mailto:` reply, delete | **Mostly works**, but "replied" is a UI-only fiction — `contact_messages` only has a 2-state `is_read` boolean server-side, so `update(id, 'replied')` just sets `is_read=true`, identical to "read." Refresh and "replied" reverts to "read." Delete is permanent, plain-admin-gated, unlogged. |
| `/admin/newsletter` + newsletter route | Subscriber list, stats, CSV export, copy-to-clipboard | **Completely broken** — the page fetches `/api/admin/newsletter-subscriptions`; the real route is `/api/admin/newsletter-subscriptions-new` (note the suffix). Every load 404s, caught and logged to console only, page always renders "No subscribers found" and all-zero stats despite live subscriber data existing one path segment away. |
| `/admin/partners`, `/admin/partners/[id]` + partner routes (list/create, detail/update/delete, commissions, payouts, referrals) | Full referral-partner management: live-computed earnings, commission approval, payout recording | **Works.** The most solidly built section of the admin area — real aggregation logic, no placeholders, no missing-table issues. |

## 2. Security

**Baseline role check is centralized, not per-route** — `src/middleware.ts`
requires `role ∈ {admin, super_admin}` for every path under `/api/admin/*`
(checked from the verified JWT), except `/api/admin/auth/*` (intentionally
public — login has to be reachable before a role exists, and the login
route itself re-checks the role after validating credentials). Individual
route files correctly don't re-check this baseline; that's the design, not
an oversight. Page routes under `/admin/*` get the equivalent check against
the `auth_token` cookie, redirecting to `/admin/login` otherwise.

**admin vs super_admin** — plain `admin` can do everything operational
(verify/feature/suspend creators and brands, manage deals, contacts,
newsletter, partners, view analytics). `super_admin` is additionally
required for: managing other admin accounts (create/update/deactivate),
changing a user's `role`, impersonating a user, and saving platform
settings. That's a sensible, consistently-enforced split everywhere it's
used — **except one inconsistency**: `DELETE /api/admin/users/[id]`
(permanent, irreversible) has no role gate beyond the baseline `admin`, so
any plain admin can hard-delete any user — brand, creator, or even another
admin/super_admin account — with no restriction on the target's role and no
logging. Changing that same user's `role` field requires super_admin;
deleting them outright does not. Worth tightening.

**Activity logging is inconsistent and mostly silent-fails right now**
because `activity_logs` doesn't exist live yet (every insert is swallowed
by `logActivity()`'s own try/catch, by design — a logging failure must
never break the action it's logging). Once the migration runs, logging
will still have gaps independent of the table:
- **Not logged at all**: user DELETE, the generic user PATCH (which is what
  the UI actually calls for activate/suspend — see §5), brand PATCH,
  contact-submission update/delete, newsletter deletion, partner
  create/update/delete/payouts, settings changes, and — most notably —
  **impersonation**, the single most sensitive action in the whole admin
  area, which doesn't call `logActivity` at all.
- **Logged, but via routes nothing calls**: the dedicated
  activate/suspend/feature/verify endpoints. In their place, the UI calls
  generic PATCH endpoints that don't log. Net effect: today, suspending or
  activating a user through the admin UI leaves no trail, even though a
  fully-built, correctly-logged endpoint for exactly that exists and is
  simply unused.

## 3. Coverage gaps — Phases 1-6 features admins cannot see or manage

Checked by grepping every file under `src/app/admin` and
`src/app/api/admin` for each table name. Result: **zero references** to
`campaigns`, `campaign_creators`, `campaign_offers`, `campaign_contracts`,
`creator_deliverables`, `deliverable_results`, `creator_payments`,
`payout_methods`, or `campaign_share_links`, anywhere in the admin area.
The only touchpoint for anything from this whole feature set is one line in
`/api/admin/analytics` counting rows in `messages` for a volume metric —
not even reading message content.

Concretely, an admin today has **no way to**:
- See any campaign (public or private), or moderate one.
- See a campaign_creators tracker row, an offer, a contract, a deliverable,
  or a posted result for any creator/brand pairing.
- See, resolve, or override a payment dispute, or see which payments are
  overdue — the brand- and creator-side UIs this session built for exactly
  that (Phase 5) have no admin equivalent at all.
- View or manage a creator's payout method, or intervene in a payout issue.
- Read conversation content for abuse handling — not even metadata beyond
  the one count in analytics. No report/flag/moderation mechanism exists.
- See a notification, an email_log entry, or the email daily-send counter —
  Phase 6A/6B shipped a whole notification + email system with zero admin
  visibility into whether it's working, what's been sent, or who's
  complained.
- See or manage a campaign's share links (the client-facing read-only
  report links built in Phase 4).

The Creators and Brands detail drawers show only the last 5 rows of the
**legacy** `deals` table — not campaign-workflow activity. The admin Deals
section is, and only ever was, about that same legacy table.

## 4. Missing basics

- **User search**: exists, works (`/admin/search`, plus filters on
  `/admin/users`).
- **Suspend/ban a user**: exists, works mechanically — but see §2/§5, the
  path the UI actually uses doesn't log it.
- **Verify brand/creator**: exists, works (`verification_status` toggle on
  both).
- **Impersonation**: exists as a backend route and a UI button, but is
  **non-functional end-to-end** — see §1. The token is correctly minted
  and never consumed by anything in the app.
- **CSV export**: exists in several places, inconsistently real. Users,
  creators, brands, deals, and the search page all have *some* CSV export.
  The dedicated full/paginated server-side export routes
  (`/api/admin/users/export`, `/api/admin/activity/export`) are both
  orphaned; the UI buttons instead export whatever page of data happens to
  already be loaded client-side. Activity's export is additionally empty
  regardless (the page never successfully loads any rows). Newsletter's
  export is unreachable (the page itself 404s before anything loads).
- **Dashboard KPIs**: exists, works (`/admin/dashboard`, `/admin/analytics`).

## 5. UI state — unfinished, broken, or placeholder

- **`/admin/activity`** — broken (wrong API path; §1).
- **`/admin/newsletter`** — broken (wrong API path; §1).
- **`/admin/settings`** — blocked, not broken: loads and displays correctly,
  every save fails cleanly until the migration runs.
- **`/admin/contacts`** — "replied" filter/status is UI-only, doesn't
  survive a refresh.
- **Orphaned-routes pattern**: five fully-built, correct backend routes
  that nothing in the frontend calls — `/activate`, `/suspend`,
  `/users/export`, `/creators/[id]/feature`, `/creators/[id]/verify`,
  `/activity/export`. Several of these were seemingly superseded by a
  generic PATCH-everything approach in the UI at some point, and never
  removed or reconnected. Worth deciding, per entry, whether to wire the
  dedicated (logged, purpose-built) route up or delete the dead one — not
  done here, this is a read-only audit.
- **Optimistic UI without error checking**: `admin/creators/page.tsx` and
  `admin/brands/page.tsx` both apply their local-state update before
  checking `res.ok`. For creators' "Feature" toggle this currently means
  the UI lies (badge flips, database doesn't change) — for everything else
  PATCHed on either page it's dormant risk, not a live bug, since those
  columns exist.
- **No mock/hardcoded fake data found anywhere** in the admin area — every
  page genuinely queries the live database. The "broken" pages are broken
  due to wrong paths or missing columns, not placeholder content.

## 6. Summary table

| Area | Status | Notes |
|---|---|---|
| Dashboard / stats | Works | No missing-table dependency. |
| Analytics | Works (mostly) | "Top Actions" panel silently always empty (`activity_logs`). |
| Search | Works | |
| Users — list/detail | Works | |
| Users — activate/suspend | Works, unlogged | UI bypasses the logged dedicated routes. |
| Users — delete | Works, unlogged, under-gated | No super_admin requirement, unlike role changes. |
| Users — impersonate | **Broken end-to-end** | Token minted, never consumed anywhere. |
| Users — export (full) | Orphaned | Dedicated route unused; UI exports visible page only. |
| Admins management | Works | Fully gated, fully logged. |
| Admin login/logout | Works | |
| Creators — list/detail/verify/suspend | Works | |
| Creators — feature | **Broken** (+ orphaned dedicated route) | Missing column; blind optimistic UI masks it. |
| Brands — list/detail/verify/suspend/delete | Works | |
| Deals (legacy) | Works | PATCH capability unreachable from UI. |
| Activity log page | **Broken** | Wrong API path (404), independent of missing table. |
| Activity export | Orphaned + will 500 | Missing table once called; currently uncalled. |
| Settings | Blocked | Correctly degrades; needs the migration to actually save anything. |
| Contacts | Works, with a UI-only status | "Replied" doesn't persist. |
| Newsletter | **Broken** | Wrong API path (404). |
| Partners (all) | Works | Most complete section of the admin area. |
| Campaign workflow (tracker/offers/contracts/deliverables/results/payments/payouts/share links) | **Missing entirely** | Zero admin visibility or management, anywhere. |
| Conversations / abuse handling | **Missing entirely** | One aggregate count in analytics; no content, no moderation. |
| Notifications / email_log / email_daily_usage | **Missing entirely** | No admin visibility into the Phase 6A/6B system at all. |
