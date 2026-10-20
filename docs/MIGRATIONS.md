# Migration Order

There is no migration runner (see CLAUDE.md). Every file below runs by hand,
top to bottom, in the Supabase SQL Editor, in the order listed — this is the
order to run them in on a fresh database. All are idempotent (`IF [NOT]
EXISTS` throughout), so re-running one that partially succeeded is safe.

This order is inferred — reconstructed from each file's own header comments
where they say so explicitly (confirmed for admin → activity → settings
below) and from git history for the rest. It is **not** a substitute for
checking actual state: run `npm run check:schema` after applying anything,
or whenever you need to know what's really live rather than what should be.

| # | File | What it adds |
|---|---|---|
| 1 | `schema.sql` | Base schema: users, creators, brands, deals, messaging, reviews, notifications, saved_creators, payments. |
| 2 | `migration.sql` | An early compatibility pass over the base schema (VARCHAR ids). Where it and `schema.sql` both declare the same table, live data shows this one's shape is what's actually running — see the note on `notifications` below. |
| 3 | `admin_migration.sql` | Admin role column + related plumbing. Its own header: run before using the admin panel. |
| 4 | `activity_migration.sql` | `activity_logs` table. Its own header: run after `admin_migration.sql`. |
| 5 | `settings_migration.sql` | `platform_settings` table. Its own header: run after `activity_migration.sql`. |
| 6 | `newsletter_contact_migration.sql` | `newsletter_subscribers`, `contact_messages`. |
| 7 | `deals_services_fix_migration.sql` | Fixes `deals.deliverables` (TEXT[] → JSONB) and a creator_services mismatch. |
| 8 | `campaigns_migration.sql` | Campaign marketplace base: `campaigns`, `campaign_deliverables`, `campaign_applications`. |
| 9 | `referral_system_migration.sql` | Referral/partner system (Phase 1 of that feature): `referral_partners`, `referral_signups`, `referral_commissions`, `referral_payouts`. |
| 10 | `creator_profile_views_migration.sql` | `creators.profile_views` counter. |
| 11 | `rate_limiting_migration.sql` | Database-backed rate limiting (`rate_limits` table, `check_rate_limit()`), replacing an in-memory Map that can't survive Vercel's serverless cold starts. |
| 12 | `phase1_messaging_migration.sql` | Messaging hardening: security, reliability, performance, attachments. |
| 13 | `phase2_tracker_migration.sql` | Campaign tracker base: `campaign_creators`, creator roster, client share links. |
| 14 | `phase3_workflow_migration.sql` | Negotiations (`campaign_offers`), deliverables + approvals (`creator_deliverables`), scheduling, `accept_campaign_offer()`, `sync_campaign_creator_status()`. |
| 15 | `phase4_fixes_migration.sql` | Bug fixes found testing Phase 3. |
| 16 | `phase4_contracts_reporting_migration.sql` | Contracts (`campaign_contracts`) and reporting. |
| 17 | `phase5_payments_tracking_migration.sql` | Payment tracking (not processing — see CLAUDE.md): `creator_payments`, `payout_methods`. |
| 18 | `phase5_followups_migration.sql` | Milestone payments, payout-encryption key versioning, race-condition guards (`split_payment()`). |
| 19 | `audit_fixes_migration.sql` | Fixes found in a full read-only audit of Phases 1-5 (brand side): `creator_deliverables.posted_at`, a kill-fee uniqueness guard, storage bucket privacy. |
| 20 | `workflow_ux_migration.sql` | Actionable system messages with deep links: `messages.related_type`/`related_id`. |
| 21 | `workflow_ux_fixes_migration.sql` | Fixes `accept_campaign_offer()` leaving a row on `'drafting'` instead of `'confirmed'` after acceptance. |
| 22 | `phase6a_notifications_migration.sql` | Brings `notifications` up to what the app code already expected (`content`, `related_type`/`related_id`, `read_at` — see note below) plus the new notification-center columns: `category`, `priority`, `archived_at`, `email_status`, `data`. |
| 23 | `phase6b_email_migration.sql` | Email via Resend: `email_log`, `email_verification_tokens`, `password_reset_tokens`, `users.email_preferences`, `conversations.last_digest_sent_at`, `email_daily_usage`. |
| 24 | `drift_fix_migration.sql` | Closes every gap in "Known drift" below: the 9 `reviews` columns (+2 the code needs that schema.sql never declared), `creator_services.includes`, `creators.is_featured`, `creators.search_vector` (+ its trigger, index, backfill), and `activity_logs`/`platform_settings` (retyped to VARCHAR(255) ids — the original UUID-vs-VARCHAR FK mismatch is why they were never created at all). Dry-run verified (wrapped in BEGIN/ROLLBACK) — every statement succeeds. |
| 25 | `phase7a_admin_migration.sql` | Admin hardening: `users.deleted_at` for soft-delete + anonymization (replaces the previous hard `DELETE /api/admin/users/[id]`) — distinct from `is_active=false` (suspended, reversible) vs `deleted_at` set (anonymized, permanent). |
| 26 | `phase7b_admin_migration.sql` | Admin visibility/control over phases 1-6: `reports` table (users reporting a message or a user; admin moderation queue). Everything else Phase 7B touches already existed live — admin internal notes/reasons go through `activity_logs`, not new columns. |
| 27 | `creator_visibility_migration.sql` | Fixes soft-deleted/suspended creators still showing on public surfaces: `creators.hidden_from_marketplace` (admin-only toggle) + a one-time retroactive cleanup (location/niches/languages cleared, platforms/portfolio/services deleted) for every account already soft-deleted before this fix. |
| 28 | `grants_migration.sql` | Explicit `service_role` grants (select/insert/update/delete on tables, usage/select on sequences, execute on functions) plus matching `ALTER DEFAULT PRIVILEGES`, needed because Supabase's Oct 30 platform change stopped auto-granting Data API access to new tables in `public`. service_role only — never `anon`/`authenticated`. Keep this as the last entry: run it again (or run a per-table grant, per the new CLAUDE.md rule) after adding any table that isn't covered by the default-privileges half of this file. |

## Known drift (as of writing — re-run `check:schema` to get current state)

- **`notifications`**: live columns are `(id, user_id, type, title, message,
  is_read, created_at)` — `schema.sql`'s declared shape (`content` instead
  of `message`, plus `related_type`/`related_id`/`read_at`) was never
  actually applied before `phase6a_notifications_migration.sql` fixed it.
  If you're reading this before running that migration, every notification
  insert fails silently (caught and swallowed) — see `docs/NOTIFICATIONS.md`.
- **`activity_logs`**, **`platform_settings`**, **`reviews`**'s 9 missing
  columns (+2 the code needs that schema.sql never declared),
  **`creator_services.includes`**, **`creators.search_vector`**,
  **`creators.is_featured`** — all fixed by `drift_fix_migration.sql` (#24
  above). `activity_logs`/`platform_settings` were never created at all:
  both declared a UUID column `REFERENCES users(id)`, but `users.id` is
  VARCHAR(255) — Postgres refuses a foreign key between incompatible
  types, so the `CREATE TABLE` itself failed outright, every time anyone
  tried to run it.

None of these were introduced by `check-schema.mjs` — it only surfaced them.
Fixing one of them going forward means writing a new
`supabase/<name>_migration.sql` per CLAUDE.md's convention, not editing the
file that first declared the column.
