# Brand-Side Expansion Audit

Date: 2026-10-14
Scope: read-only analysis against the planned feature list (reliable fast messaging, agency mode, creator invite links, campaign tracker, creator roster, shareable client progress link, negotiations, contracts, scheduling, deliverable approvals, analytics/reporting, escrow payments). No files were modified as part of this audit except this document.

---

## 1. Messaging (most detail here)

### 1.1 Tables — exact SQL

Three tables exist, defined twice (once in `supabase/schema.sql`, again with a different id convention in `supabase/migration.sql`). Base definitions, `supabase/schema.sql:350-422`:

```sql
CREATE TABLE deal_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]', -- Array of {url, filename, type, size}
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_deal_messages_deal ON deal_messages(deal_id);
CREATE INDEX idx_deal_messages_sender ON deal_messages(sender_id);
CREATE INDEX idx_deal_messages_created ON deal_messages(created_at);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL, -- optional link to a deal
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  creator_unread INTEGER DEFAULT 0,
  brand_unread INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, brand_id)
);
CREATE INDEX idx_conversations_creator ON conversations(creator_id);
CREATE INDEX idx_conversations_brand ON conversations(brand_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at);
```

`supabase/migration.sql:190-252` defines a **second, incompatible** copy of all three tables using `VARCHAR(255)` ids instead of native `UUID`. `supabase/migration.sql` also sets permissive RLS overrides specifically on these three tables: `CREATE POLICY conversations_all ON conversations FOR ALL USING (true)` (and the equivalent `messages_all`, `deal_messages_all`). There's no migration runner, so which of the two definitions is actually live depends on which file was run against the database — the code (VARCHAR-style ids passed around as strings, no UUID parsing) and the campaigns migration's own comments indicate the `migration.sql` VARCHAR convention is what's actually live.

The `UNIQUE(creator_id, brand_id)` constraint on `conversations` means there can only ever be **one** conversation thread per creator/brand pair, regardless of how many deals or campaigns connect them.

### 1.2 Every route and component involved

**API routes (`src/app/api/`):**

| Route | Methods | Live? |
|---|---|---|
| `conversations/route.ts` | GET (list), POST (find-or-create) | Live |
| `conversations/[id]/route.ts` | GET (thread + all messages), DELETE | Live |
| `conversations/[id]/messages/route.ts` | GET (list + mark-as-read side effect), POST (send) | **Live — this is the route the UI actually calls** |
| `messages/route.ts` | GET (cursor-paginated list), POST (send, with contact-info detection), PATCH (mark-read) | **Dead** — zero frontend callers, and broken if ever called (see 1.5) |
| `campaigns/[id]/applications/[applicationId]/message/route.ts` | POST | Live — brand-only, finds-or-creates a conversation with an applicant and optionally sends an opening message |

**Pages/components:**
- `src/app/messages/page.tsx` — conversation list, calls `GET /api/conversations`.
- `src/app/messages/[id]/page.tsx` — single thread view. One-shot `fetch` on mount (`useEffect` with no interval), renders messages inline, composes/sends inline (no shared component).
- `src/components/messaging/ChatThread.tsx`, `ConversationList.tsx`, `MessageInput.tsx`, `index.ts` — a parallel, more polished set of messaging components (attachment preview, attachment upload UI in `MessageInput.tsx`) that **no page imports**. Confirmed via `grep -rln "ConversationList|ChatThread|MessageInput" src/app` returning zero matches. This is dead/orphaned UI code — built, never wired in.

### 1.3 Delivery mechanism

**No Realtime, no polling, no WebSocket.** `src/app/messages/[id]/page.tsx` fetches once on mount and never again while the thread is open. Sending a message does a local-only optimistic append; the other party sees nothing until they manually reload the page. Confirmed via full read of the component and a repo-wide grep for `supabase.channel`/`.on('postgres_changes'`/realtime usage, none found anywhere in the messaging code path.

The notification bell (`DashboardHeader.tsx`) polls `/api/notifications` every 5 seconds via `setInterval`, but only renders for `userType === 'brand'`; creators get no bell, only a badge in `ProfileDropdown.tsx`. This is irrelevant to in-thread delivery anyway, since (per section 1.5) the `new_message` notification type is never actually triggered by the live send route.

Realtime is moot regardless of RLS/`auth.uid()` mismatch, because nothing in the app subscribes to it — not a "Realtime is broken because of custom JWT" problem, but a "Realtime was never attempted" gap.

### 1.4 Unread counts / pagination / ordering

- Unread counts: `conversations.creator_unread` / `brand_unread`, integer counters. The live GET mark-as-read path (`conversations/[id]/messages/route.ts`) accepts `user_id` as a **plain query string parameter**, looks it up against `creators.user_id` to decide whether to zero `creator_unread` or `brand_unread` — not derived from the authenticated JWT (see 1.6, Bug #1).
- Pagination: the live `GET /api/conversations/[id]/messages` route does an unbounded `select('*')` with **no `.limit()`** — the entire thread's message history is fetched every time the page loads. The dead `/api/messages` route has proper cursor pagination (`before`/`limit`, capped at 100, `hasMore`) but nothing calls it.
- Ordering: messages ordered by `created_at` ascending (oldest first) in the live route; conversations list ordered by `last_message_at DESC`.

### 1.5 Performance issues

- **Unbounded message fetch** on every thread open (`conversations/[id]/messages/route.ts` GET, and `conversations/[id]/route.ts` GET) — a creator-brand pair with a long history (exactly the 40-50+ creator, high-volume scenario the planned feature targets) will re-download the full thread on every page load/refresh.
- **Whole-thread refetch, no incremental fetch** — there is no "fetch messages since X" path live; every open is a full table scan of that conversation's `messages` rows.
- `conversations` list GET does 2 extra batched lookups (creators, brands) rather than N+1 — acceptable.
- No index exists on `(conversation_id, created_at)` composite — only separate single-column indexes (`idx_messages_conversation`, `idx_messages_created`). Not urgent at current scale, but will matter once thread lengths grow with 40-50+ concurrent creator relationships.

### 1.6 Bugs / race conditions, ranked by severity

1. **CRITICAL — No authentication on the live message routes.** `GET` and `POST /api/conversations/[id]/messages` read `user_id`/`sender_id` from client-supplied query params / request body only, with **zero check against the `x-user-id`/`x-profile-id` headers** that every other route in this codebase correctly trusts. Any authenticated (or even unauthenticated — the route itself doesn't check for a token) caller can impersonate any sender in any conversation, or mark any other user's messages as read. `GET /api/conversations/[id]/route.ts` has the same gap (full thread readable by anyone who knows the conversation id, no ownership check at all — note: `DELETE` on the same file *does* check ownership correctly, so this is an inconsistency, not a missing pattern).
2. **CRITICAL — Notifications silently fail for every message (and everything else).** `createNotification()` (`src/lib/notifications.ts`) inserts into columns `message`/`link`, but the real `notifications` table (`schema.sql:461-485`) only has `content`/`related_type`/`related_id`. Every `supabase.insert()` call fails, the error is caught and only `console.error`'d (never thrown, never surfaced) — so brands/creators have never received a real notification for a new message, deal status change, campaign application, or referral commission. This is a blocking defect for "I'll manage 40-50+ creators" — there is currently no out-of-band signal that a message arrived.
3. **HIGH — No live delivery.** As above: one-shot fetch, no polling/Realtime. At 40-50+ active creator relationships, this means constant manual refreshing to see new messages.
4. **HIGH — Deal-status system messages never post.** `accept`/`decline`/`deliver`/`revision`/`approve` routes all gate a "post a system message" block on `if (deal.conversation_id)`, but **`deals` has no `conversation_id` column** (only `messages.conversation_id` and `conversations.deal_id` exist — the reverse direction). The condition is always false; even if it were true, the insert would additionally fail on nonexistent `sender_type`/`is_system_message` columns (same shape of bug as the dead `/api/messages` route). Net effect: a brand/creator gets no in-thread record that a deal moved to delivered/approved/etc.
5. **MEDIUM — Unbounded queries** (section 1.5) will degrade as thread history grows; not an active bug today at current data volumes but will become one.
6. **LOW — Two incompatible table definitions** (`schema.sql` UUID vs. `migration.sql` VARCHAR) for the same three tables, with no migration runner recording which actually ran. Risk is confusion/drift for any future migration author, not a live runtime bug (the deployed DB has settled on one of them already).

### 1.7 `deal_messages` vs `messages` — are they separate, should they merge?

`deal_messages` is **fully dead**: the only reference to it anywhere in `src/app/api` is a read-only query in `src/app/api/admin/activity/route.ts` for the admin activity feed — nothing ever inserts into it, so that feed source is permanently empty. The system's actual intent (visible from the `accept`/`decline`/`deliver`/`revision`/`approve` routes all attempting to post into `messages` via a deal's conversation) is that deal-related messages should flow through the regular `conversations`/`messages` pair, with `conversations.deal_id` as the link — not through a separate table. **Recommendation: delete/ignore `deal_messages` rather than "merge" it — there's nothing to migrate out of it, since it was never written to.** Fixing the broken `deal.conversation_id` references (bug #4 above) to actually resolve the conversation via `conversations.deal_id` (or via the creator/brand pair) is the real fix needed, not a merge.

### 1.8 Attachments / read receipts / typing indicators / notification-on-message

- **Attachments:** `attachments JSONB` column exists on both `messages` and `deal_messages`, and the dead `MessageInput.tsx` component has a full attachment-picker UI (`src/components/messaging/MessageInput.tsx`) — but it's unused, and there is no upload endpoint for chat attachments: only 2 Supabase Storage buckets exist (`avatars` public, `payment-proofs` private with no live upload path). **No working attachment upload exists anywhere in the live message-send path.**
- **Read receipts:** `is_read`/`read_at` columns exist and are written by the live mark-as-read GET side effect, but there's no UI indicator (checkmarks, "seen" label) rendered anywhere in `src/app/messages/[id]/page.tsx`.
- **Typing indicators:** no code, no column, no UI. Absent entirely.
- **Notification on message:** the dead `/api/messages` route calls `createNotification()` with type `new_message` (which would fail anyway per bug #2); the live route (`conversations/[id]/messages/route.ts`) **never calls `createNotification` at all** — message recipients get zero notification through any currently-executing code path.

---

## 2. Brand side

### 2.1 Pages and routes (one-line each)

**Pages:**
- `src/app/(auth)/signup/brand/page.tsx` — 2-step brand signup (credentials, then company info).
- `src/app/dashboard/brand/page.tsx` — brand home: profile summary, recent deals, referral banner.
- `src/app/dashboard/campaigns/page.tsx` — brand's campaign list with status tabs.
- `src/app/dashboard/campaigns/[id]/applications/page.tsx` — applicants to one campaign, status tabs.
- `src/app/dashboard/campaigns/[id]/applications/[applicationId]/page.tsx` — single application review.
- `src/app/dashboard/deals/page.tsx` — deals list (shared brand/creator component).
- `src/app/dashboard/deals/[id]/page.tsx`, `.../review/page.tsx` — deal detail / approve-and-review flow.
- `src/app/dashboard/deals/new/page.tsx` — brand creates a direct deal offer.
- `src/app/campaigns/create/page.tsx`, `src/app/campaigns/[id]/edit/page.tsx` — campaign authoring wizard (create/edit).
- `src/app/campaigns/[id]/page.tsx` — campaign detail, branches by viewer role.
- `src/app/campaigns/page.tsx` — public campaign marketplace listing.
- `src/app/settings/brand/page.tsx` — Company Profile / Notifications / Payments / Security tabs (only Company Profile is wired to a real API — see 2.2).
- `src/app/messages/page.tsx`, `src/app/messages/[id]/page.tsx` — shared with creators.
- `src/app/admin/brands/page.tsx`, `src/app/admin/deals/page.tsx` — admin views over brand data.

**API routes:**
- `api/brands/route.ts` (GET list, POST create), `api/brands/[id]/route.ts` (GET, PUT — ownership via `x-user-id`).
- `api/campaigns/route.ts` (GET, POST), `api/campaigns/[id]/route.ts` (GET/PUT/DELETE), `.../publish`, `.../close` — all owner-gated via `x-profile-id`.
- `api/campaigns/[id]/applications/route.ts` (GET list for owner, POST for applicant), `.../applications/[applicationId]/route.ts` (PUT status update), `.../applications/[applicationId]/message/route.ts` (opens a conversation).
- `api/deals/route.ts` (GET, POST — brand-initiated), `api/deals/[id]/route.ts`, `.../approve`, `.../revision` (brand-only actions); `.../accept`, `.../decline`, `.../deliver` (creator-side, brand is the notified party).
- `api/conversations*`, `api/reviews/route.ts`, `api/notifications/route.ts` — shared/brand-relevant.
- `api/admin/brands/route.ts`, `.../[id]/route.ts`, `api/admin/deals/*` — admin-only.

### 2.2 Brand onboarding/profile fields

`brands` table (`supabase/migration.sql:133-153`, the live VARCHAR-id convention): `id`, `user_id` (UNIQUE), `company_name`, `company_website`, `logo_url`, `description`, `industry`, `company_size`, `country`, `contact_name`, `contact_role`, `verification_status`, `verified_at`, `total_deals`, `total_spent`, `avg_rating_given`, `stripe_customer_id`, `created_at`/`updated_at`.

Signup (`signup/brand/page.tsx`) collects: `companyName`, `website`, `industry`, `companySize`, `country`, `contactName`, `contactRole`, `description` — maps cleanly, 1:1, to the columns above. **Not collected at signup:** `logo_url`.

Settings page (`settings/brand/page.tsx`) exposes the same fields for editing via `PUT /api/brands/[id]`, plus:
- A "Change Logo" button with **no `onClick` handler** — dead UI, `logo_url` has no working set path anywhere.
- "Notifications", "Payments", "Security" tabs are **entirely static placeholder UI** — local React state only, no API calls, no backend wiring (e.g. "Add Payment Method" and "Update Password" buttons with no handlers). `stripe_customer_id` is not surfaced anywhere in the real UI.

### 2.3 Can one brand account represent multiple client brands today? No.

Hard-wired 1:1, enforced at the database level: `brands.user_id` is `UNIQUE NOT NULL`. Login does `.eq('user_id', user.id).single()` and bakes exactly one `profileId` into the JWT (`api/auth/login/route.ts`); `src/middleware.ts` injects exactly one `x-profile-id` per request; every brand-scoped write (`campaigns`, `deals`, `brands/[id]` PUT) checks the caller's single header-derived profile id against the resource, with no "acting on behalf of" concept anywhere. No `organizations`/`agencies` table, no many-to-many between `users` and `brands`, no client-identity override field on `campaigns`/`deals` (the brand's displayed name/logo is always pulled live from the single owning `brands` row). Agency mode would require: a new parent entity with a one-to-many relationship to `brands` rows, a way for one `users` row to link to several `brands` rows, and a profile-switching mechanism replacing the current fixed single `profileId` JWT claim — none of which exist in any partial form today.

---

## 3. Creator side relevant to invites

### 3.1 Signup / profile-completion flow

`src/app/(auth)/signup/creator/page.tsx` — 3-step wizard (credentials; username/display name/avatar/bio/country/city/languages; niches/platforms). Every field starts blank; there is no code path that reads a pre-fill/invite token into `formData`. `src/lib/profile-completion.ts` (`calculateProfileCompletion`) is a post-signup completeness scorer only (avatar, bio, platforms, rates, niches) — it operates on an already-existing creator row and has nothing to do with invitations.

### 3.2 Invite/claim-link mechanism — confirmed absent

`POST /api/creators` requires `user_id`/`username`/`display_name` and always creates a normal `verification_status: 'pending'` profile; no token/claim parameter, no "invited_by_brand_id", no unclaimed/placeholder-profile concept. A repo-wide grep for `invite`/`claim link`/`claim code`/`invite token` returns zero real hits — the only incidental match is `ReferralBanner.tsx`'s copy "You were invited by {partnerName}", which is the **unrelated affiliate/referral system** (`referral_partners` → `referral_signups` → `referral_commissions`, a generic growth-partner mechanism where an external partner earns commission on referred creators' deals — not a brand pre-inviting a specific creator). **Verdict: 100% absent. Nothing to repurpose; this is a net-new feature.**

### 3.3 Creator profile fields (follower counts, views, rates)

- Aggregate: `creators.total_followers`, `creators.avg_engagement_rate`, `creators.min_budget` (a general rate floor, not tied to a specific service).
- Per-platform: `creator_platforms.followers`, `.engagement_rate`, `.avg_views` (no aggregate "avg views" exists on `creators`, only per-platform).
- Per-service pricing: `creator_services.price` + `currency`, one row per service/content-type/platform combination.

---

## 4. Deals and campaigns

### 4.1 `deal_status` lifecycle

Enum (`schema.sql:20-30`): `pending`, `accepted`, `paid`, `in_progress`, `delivered`, `revision`, `completed`, `cancelled`, `disputed`. No migration ever adds to this enum.

Actual transitions driven by code (brand vs. creator actor noted):
- `POST /api/deals` (brand) → creates at `pending`.
- `accept` (creator, must own deal, requires `pending`) → **`in_progress`** — skips the enum's `accepted`/`paid` states entirely; no payment/escrow step is wired in.
- `decline` (creator, requires `pending`) → sets status to **`'declined'`**, which is **not a member of the `deal_status` enum** anywhere in `supabase/` — a schema/code mismatch; this write either fails in production or the live DB has an undocumented out-of-band enum value.
- `deliver` (creator, requires `in_progress` or `revision`) → **`delivered`**, hard-blocked unless every `deliverables[].is_completed === true`.
- `revision` (brand, requires `delivered`, enforces `revisions_used < revisions_allowed`) → **`revision`**, increments `revisions_used`.
- `approve` (brand, requires `delivered`) → **`completed`**; also fires referral-commission calculation, increments `creators.total_deals_completed`/`total_earnings` and `brands.total_deals`/`total_spent`.
- `PUT /api/deals/[id]` (either party) — general update of `title`/`description`/`deliverables`/`deadline` only; **cannot itself drive a status transition**, but is the route that writes the `deliverables` JSONB.

### 4.2 Negotiation / counter-offer — absent

No `negotiat`/`counter` match anywhere in `src/app/api`. The only "negotiable" concept is `campaigns.budget_type` (`'fixed' | 'range' | 'negotiable'`) — a display label on how the brand presents its budget, not a counter-proposal mechanism. No counter-amount field on `deals` or `campaign_applications`, no negotiate API route, no UI.

### 4.3 Deliverable approval, distinct from completion — absent

Deliverable completion is **creator self-reported**, UI-gated only (not API-gated — `PUT /api/deals/[id]` accepts a full `deliverables` replacement from either party, since the check is only "caller is creator_id or brand_id of this deal"). The UI only exposes the toggle to the creator (`canDeliver = isCreator && ...`). There is no "brand approves/rejects this one deliverable" endpoint or field — approval is deal-level only (`approve` route approves the entire delivered deal at once).

### 4.4 Scheduling — thin

Only `deals.deadline`/`delivery_days`/`revisions_allowed`/`revisions_used`, plus on campaigns: `application_deadline`, `campaign_start_date`, `campaign_end_date`, and a per-deliverable `deadline` on `campaign_deliverables`. No multi-milestone schedule, no calendar/date-range picker, no recurring deliverable dates anywhere.

### 4.5 `deliverables` JSONB — shape and writers

Shape: `{id, description, is_completed}` per item (confirmed via the `DeliverableItem` interfaces in `deals/[id]/route.ts` and `deliver/route.ts`, and the `deals_services_fix_migration.sql` comment that converted the column from `TEXT[]` to `JSONB` for this purpose). Written via `PUT /api/deals/[id]`, which does not itself restrict the writer to the creator (see 4.3) — enforcement is UI-only.

### 4.6 `campaign_applications` lifecycle

Statuses: `submitted → viewed → shortlisted → rejected → hired` (no enforced state machine — the brand's `PUT` can set any status to any other status in one call). `applications_count`/`hired_count` are maintained by DB triggers, not application code. **Hiring an applicant does not create a `deals` row** — campaign applications and paid deals are two separate, currently unconnected flows.

### 4.7 `payments` table — fully dead

Defined in `schema.sql:508-535` (Stripe ids, amount/fee/payout, status) with RLS enabled, but zero application code anywhere references `.from('payments')`. All money/status fields that would need it are duplicated directly on `deals` (`stripe_payment_intent_id`, `paid_at`, `released_at`, `amount`, `platform_fee`, `creator_payout`), and every deal route reads/writes those `deals` columns exclusively.

---

## 5. Infra relevant to new features

### 5.1 Notifications

`notifications` table (`schema.sql:461-485`): `id`, `user_id`, `type`, `title`, `content`, `related_type`, `related_id`, `is_read`, `read_at`, `created_at`. `createNotification()` (`src/lib/notifications.ts`) inserts `message`/`link` instead of `content`/`related_type`/`related_id` — **every notification insert across the entire app silently fails** (caught, `console.error`'d only, never thrown). 11 call sites exist (`deal_created`, `deal_accepted`, `deal_declined`, `deal_delivered`, `deal_approved`, `deal_revision`, `new_message` ×2 in the dead `/api/messages` route, `campaign_application`, `campaign_application_update`, `referral_commission_earned`, `referral_commission_approved`) — all currently no-ops. `deal_completed` is a declared type with no call site at all. The notification bell polls every 5s, brand-only; creators get a badge via `ProfileDropdown.tsx` only. No Realtime/WebSocket anywhere.

### 5.2 Supabase Storage

Two buckets: `avatars` (public, has a working upload path used at creator/brand signup) and `payment-proofs` (private, table/bucket exist but **no live upload route** calls it). No bucket or upload path exists for chat attachments, campaign deliverable files, or contracts.

### 5.3 Email

No email-sending code exists anywhere. SMTP env vars are declared (commented out) in `.env.example` but unused: `SMTP_SERVER`, `SMTP_PORT`, `SMTP_EMAIL`, `SMTP_PASSWORD`, `SMTP_FROM_NAME`. Per CLAUDE.md's own Known Limitations: ask before implementing.

### 5.4 Middleware — exact public/optional route lists (`src/middleware.ts`)

```ts
function isPublicApiRoute(pathname: string, method: string): boolean {
  if (pathname.startsWith('/api/auth/')) {return true}
  if (pathname.startsWith('/api/admin/auth/')) {return true}
  if (method === 'GET' && (pathname.startsWith('/api/creators') || pathname.startsWith('/api/brands'))) {return true}
  if (method === 'POST' && pathname === '/api/newsletter/subscribe') {return true}
  if (method === 'POST' && pathname === '/api/contact') {return true}
  if (method === 'GET' && pathname === '/api/referral/lookup') {return true}
  if (method === 'POST' && pathname === '/api/referral/track') {return true}
  if (method === 'POST' && /^\/api\/creators\/[^/]+\/view$/.test(pathname)) {return true}
  return false
}

function isOptionalAuthApiRoute(pathname: string, method: string): boolean {
  if (method !== 'GET') {return false}
  if (pathname === '/api/campaigns') {return true}
  if (/^\/api\/campaigns\/[^/]+$/.test(pathname)) {return true}
  return false
}
```

Notable: `GET /api/conversations/[id]` and `GET`/`POST /api/conversations/[id]/messages` are **not** in either list, so they go through the normal "requires a valid JWT" path — but as section 1.6 shows, the route handlers themselves never check the resulting `x-user-id`/`x-profile-id` headers against the conversation's parties, so a valid JWT belonging to *any* user is enough to read or post into *any* conversation.

### 5.5 Deployment / cron

`vercel.json` is present but empty (`{}`) — no cron jobs, no custom config. No background job scheduler, queue, or cron definition exists anywhere in the repo. Target is Vercel (Next.js project, `vercel.json` present) with no serverless cron currently configured.

---

## 6. Output format

### 6.1 Feature status table

| Feature | Status | What exists (file paths) | What's needed |
|---|---|---|---|
| Reliable fast messaging | **Partial, with critical bugs** | `conversations`/`messages` tables; `api/conversations*` routes; `app/messages/*` pages | Fix missing auth checks (§1.6 #1), fix notification insert (§1.6 #2), add live delivery (polling or Realtime), fix/remove dead system-message blocks (§1.6 #4), bound message queries, wire up or delete the orphaned `src/components/messaging/*` components |
| Agency mode | **Missing** | None — `brands.user_id` is UNIQUE 1:1, single `profileId` per JWT | New parent entity (organization/agency), many-to-many `users`↔`brands`, profile-switching mechanism, client-identity display override on campaigns/deals |
| Creator invite links | **Missing** | None (only the unrelated affiliate/referral system exists) | Invite-token generation, a claim/pre-fill signup path, a way to mark a profile as brand-invited |
| Campaign tracker per creator (access → draft → planned date → posted, + payout/charge/profit) | **Missing** | `deals`/`campaign_applications` have unrelated status enums (not this lifecycle); `deliverables` JSONB has only `is_completed`, no date/status staging | A new status model matching this exact lifecycle, plus per-creator payout/charge/profit fields (currently only deal-level `amount`/`platform_fee`/`creator_payout` exist, scoped to one deal, not an ongoing per-creator ledger) |
| Reusable creator roster with typical rates | **Partial** | `creator_services.price`, `creators.min_budget`, `saved_creators` table (brand can save/bookmark creators) | `saved_creators` is a simple bookmark list, not a roster with negotiated/typical rates per brand-creator relationship; would need a brand-specific rate-override table |
| Shareable read-only client progress link | **Missing** | None — no public/token-based read-only view of any deal or campaign exists | A token-based public route + a minimal read-only view (no auth required, scoped by token) |
| Negotiations (offer/counter-offer) | **Missing** | `campaigns.budget_type` is a label only | Counter-amount field + negotiate API route + UI, on `deals` and/or `campaign_applications` |
| Contracts | **Missing** | None found anywhere in schema or code | New table + generation/e-sign flow |
| Scheduling/timelines | **Partial (thin)** | `deals.deadline`/`delivery_days`; `campaigns.application_deadline`/`campaign_start_date`/`campaign_end_date`; `campaign_deliverables.deadline` | Multi-milestone/calendar scheduling if the planned per-creator tracker needs more than single dates |
| Deliverable approvals | **Partial** | `deliverables[].is_completed`, UI-gated creator-only toggle, deal-level `approve` route | Per-deliverable brand approval/rejection distinct from deal-level approval; currently API does not even restrict the toggle to the creator (UI-only gate) |
| Analytics/reporting | **Minimal** | `creators.profile_views`, `brands.total_deals`/`total_spent`, `creators.total_deals_completed`/`total_earnings` — simple counters only | Any real reporting/dashboard beyond raw counters; no time-series or export exists |
| Escrow-style payments | **Missing** | `payments` table exists in schema but is **never read or written by any code**; `deals` has Stripe-shaped columns (`stripe_payment_intent_id`, `paid_at`, `released_at`) that are also never populated by a real payment flow; `stripe`/`@stripe/stripe-js` packages were removed in a prior audit | A full payment integration from scratch — no partial implementation to build on despite the schema looking ready |

### 6.2 Top 10 bugs/risks, ranked by severity

1. **No auth/ownership check on live message routes** (`GET /api/conversations/[id]`, `GET`/`POST /api/conversations/[id]/messages`) — any authenticated user can read or post into any conversation, impersonating any sender.
2. **All notifications silently fail** — `createNotification()` writes to nonexistent `message`/`link` columns; every one of 11 call sites has been a no-op since inception, errors swallowed to `console.error` only.
3. **`deal_status` has a code/schema mismatch** — `decline` route sets `'declined'`, which isn't in the `deal_status` enum.
4. **Deal-status system messages never post** — every one of 5 deal-lifecycle routes guards on `deal.conversation_id`, a column that doesn't exist on `deals`.
5. **No live message delivery** — one-shot fetch on thread open, no polling/Realtime; directly blocks the stated "reliable fast messaging at 40-50+ creators" goal.
6. **Unbounded message/thread queries** — no `.limit()` on `GET /api/conversations/[id]/messages` or `/api/conversations/[id]`; will degrade as thread history grows.
7. **Deliverable completion is API-unenforced** — `PUT /api/deals/[id]` lets either party (not just the creator) rewrite the full `deliverables` array; the "creator-only" rule is UI-only.
8. **Campaign "hired" status doesn't create a deal** — hiring an applicant and creating a paid `deals` row are disconnected; a brand can mark someone hired with no corresponding deal ever created.
9. **Orphaned messaging UI** — `src/components/messaging/{ChatThread,ConversationList,MessageInput}.tsx` are fully built (including attachment UI) but never imported anywhere; real pages duplicate the logic inline, with none of the attachment support.
10. **Two incompatible schema definitions** (`schema.sql` UUID vs. `migration.sql` VARCHAR ids) for `conversations`/`messages`/`deal_messages`/`reviews`, with no migration runner to record which one is actually live — a standing risk for any future migration author.

### 6.3 Open questions for the user

1. Given the messaging bugs above (especially #1, auth bypass, and #2, dead notifications), do you want those two fixed as a prerequisite before building any new brand-side features on top of messaging, or should the new features be scoped first and the fixes bundled in later?
2. For the campaign tracker's lifecycle (access → draft → planned date → posted), should this live on the existing `deals`/`campaign_applications` tables (extending their status models) or as a new dedicated table? The current statuses don't map onto this lifecycle at all.
3. For agency mode, is the near-term need "one login manages several client brands" (requires the org/multi-brand schema work described in §2.3), or is it closer to "one Infoishai-owned brand account, with client attribution tracked informally" (much smaller lift, e.g. a `client_label` free-text field on campaigns)?
4. For the shareable read-only client progress link, what should it expose exactly — a single campaign's deliverable statuses? A creator-by-creator view across many campaigns for one client? This affects whether it is scoped per-campaign or per-"client" (and interacts with the agency-mode question above).
5. For escrow payments: since `stripe` was explicitly removed in a prior audit and the `payments` table is fully unused, is Stripe Connect (or another specific provider) the intended path, or is this meant to be a purely internal ledger (no real money movement, consistent with the current "Deals only track computed numbers" model)?
6. Should `deal_messages` and the dead `/api/messages` route simply be deleted, since neither is used and keeping them around risks a future author building on the wrong one?
7. Is the creator roster meant to be per-brand (my own private list of creators + my negotiated rates with each) or platform-wide? This determines whether it extends `saved_creators` or needs a new table entirely.
