# Notification Center — Event Catalog (Phase 6A + 6B email)

Every notification the app creates goes through `emitEvent()` (or its
sibling `emitNewMessageNotification()`) in `src/lib/events/emit.ts`. The
copy, category, and priority for each event type live in one place:
`src/lib/events/catalog.ts` (`EVENT_CATALOG`). This document is a
by-hand index of that file — if you add or change an entry there, update
this table too.

**Never notify the actor about their own action** — `emitEvent` filters the
actor out of the recipient list automatically. **Never put `charge_amount`,
`profit`, `brand_notes`, or `client_name` into any event a creator can
receive** — `scripts/security-check.mjs` asserts this over real HTTP.

Categories: `messages` · `offers` · `contracts` · `work` · `payments` · `account`
Priority: `action` (you need to do something) · `info` (FYI)

**📧** marks an event in `IMMEDIATE_EMAIL_EVENTS` (`src/lib/events/emit.ts`)
— these send an email the moment they fire (subject to the recipient's
category preference), not just an in-app notification. Everything else
only reaches email through the daily summary (`info` events) or the
message digest (`new_message`).

## Campaign workflow (campaign_creators tracker)

| Event type | Category | Priority | Recipient | Fired from |
|---|---|---|---|---|
| `added_to_campaign` 📧 | work | action | the creator | `POST /api/campaigns/[id]/creators` |
| `offer_sent` 📧 | offers | action | the other party | `POST .../offers` |
| `offer_countered` 📧 | offers | action | the other party | `POST .../offers/[offerId]/counter` |
| `offer_accepted` | offers | info | the original sender | `POST .../offers/[offerId]/accept` |
| `offer_declined` | offers | info | the original sender | `POST .../offers/[offerId]/decline` |
| `offer_withdrawn` | offers | info | the other party | `POST .../offers/[offerId]/withdraw` |
| `offer_expired` | offers | info | the original sender | `expireStaleOffers()` (lazy, called from every offer-reading route) |
| `contract_sent` 📧 | contracts | action | the creator | `POST .../contracts/[contractId]/send` |
| `contract_signed_by_creator` 📧 | contracts | action | the brand | `POST .../contracts/[contractId]/sign` (creator signs) |
| `contract_fully_signed` | contracts | info | the creator | `POST .../contracts/[contractId]/sign` (brand countersigns) |
| `contract_declined` | contracts | info | the other party | `POST .../contracts/[contractId]/decline` |
| `contract_voided` | contracts | info | the creator | `voidContractOnTermsChange()` (terms changed after a full signature) |
| `deliverable_added` | work | info | the creator | `POST .../deliverables` |
| `deliverable_edited` | work | info | the creator | `PUT .../deliverables/[deliverableId]` |
| `deliverable_draft_submitted` 📧 | work | action | the brand | `POST .../deliverables/[deliverableId]/submit-draft` |
| `deliverable_changes_requested` 📧 | work | action | the creator | `POST .../deliverables/[deliverableId]/request-changes` |
| `deliverable_approved` | work | action | the creator | `POST .../deliverables/[deliverableId]/approve` |
| `deliverable_posted` | work | action | the brand | `POST .../deliverables/[deliverableId]/submit-posted` |
| `deliverable_completed` | work | info | the creator | `POST .../deliverables/[deliverableId]/complete` |
| `results_added` | work | info | the brand | `POST .../deliverables/[deliverableId]/results` |
| `payment_due` | payments | action | the brand | `refreshDuePayments()` (lazy, called from every payments-reading route) |
| `payment_split` | payments | info | the creator | `splitPayment()` |
| `payment_marked_paid` 📧 | payments | action | the creator | `markPaymentPaid()` |
| `payment_confirmed` | payments | info | the brand | `confirmPaymentReceived()` |
| `payment_disputed` 📧 | payments | action | the brand | `disputePayment()` |
| `payment_cancelled` | payments | info | the creator | `cancelPayment()` |
| `kill_fee_created` | payments | info | the creator | `createKillFeeIfEligible()` (row dropped after a draft existed) |

Not wired through emitEvent (deliberately log-only, no notification — see
`logCampaignCreatorEvent()` call sites): `contract_drafted`, `payment_created`,
`deliverable_removed`, `deliverable_split`, `results_edited`, `results_removed`.
`contract_drafted` in particular already has its own tracker-level banner
("Offer accepted. Review and send the contract.") — a notification on top
would be redundant with the event that triggered it (`offer_accepted`).

## Messages

| Event type | Category | Priority | Recipient | Fired from |
|---|---|---|---|---|
| `new_message` | messages | action | the other party in the conversation | `POST /api/conversations/[id]/messages` |

One row per **conversation**, not per message (`emitNewMessageNotification()`
upserts instead of inserting) — an active back-and-forth doesn't flood the
list. Any new message refreshes the preview and flips it back to unread
even if the previous ping had already been read.

**No per-message (or per-notification) email.** `GET /api/cron/message-digest`
emails "You have N unread messages from X" once a conversation has sat
unread for 15+ minutes, throttled to once per conversation per 3 hours
(`conversations.last_digest_sent_at`). See **Email** below.

## Campaign applications (pre-tracker)

| Event type | Category | Priority | Recipient | Fired from |
|---|---|---|---|---|
| `application_received` | account | action | the brand | `POST /api/campaigns/[id]/applications` |
| `application_viewed` | account | info | the applicant | `PUT /api/campaigns/[id]/applications/[applicationId]` |
| `application_shortlisted` | account | info | the applicant | same, `status: 'shortlisted'` |
| `application_rejected` | account | info | the applicant | same, `status: 'rejected'` |
| `application_hired` | account | action | the applicant | same, `status: 'hired'` |

## Legacy deals (1:1 flow, separate from the campaign workflow)

| Event type | Category | Priority | Recipient | Fired from |
|---|---|---|---|---|
| `deal_created` | account | action | the creator | `POST /api/deals` |
| `deal_accepted` | account | info | the brand | `POST /api/deals/[id]/accept` |
| `deal_declined` | account | info | the brand | `POST /api/deals/[id]/decline` |
| `deal_delivered` | account | action | the brand | `POST /api/deals/[id]/deliver` |
| `deal_approved` | account | info | the creator | `POST /api/deals/[id]/approve` |
| `deal_revision` | account | action | the creator | `POST /api/deals/[id]/revision` |

## Referral / partner

| Event type | Category | Priority | Recipient | Fired from |
|---|---|---|---|---|
| `referral_commission_earned` | account | info | the partner | `calculateReferralCommission()` (deal approved, referred creator) |
| `referral_commission_approved` | account | info | the partner | `PUT /api/admin/partners/[id]/commissions` |

## Account

| Event type | Category | Priority | Recipient | Fired from |
|---|---|---|---|---|
| `account_created` | account | info | the new user, about themselves | `POST /api/auth/register` |

## Reserved, not yet wired

- `payout_method_missing` (`NotificationType` in `src/lib/notifications.ts`) —
  no call site exists yet. Add a catalog entry before using it.

## Email (Phase 6B)

`src/lib/email/send.ts` calls Resend's REST API directly via `fetch` — no
SDK dependency. Every send is logged to `email_log`
(`idempotency_key` UNIQUE is the hard backstop against double-sends).
Without `RESEND_API_KEY` set, emails are logged to the server console
instead of sent (local dev).

**Three email paths:**
1. **Account/security** (welcome, verify-email, password-reset) — always
   sent, never gated by preferences, never deferred by the daily quota.
2. **Immediate action email** — the 📧-marked events above, the instant
   they fire. Gated by the recipient's per-category `email_preferences`.
3. **Digest/summary** — `GET /api/cron/message-digest` (unread messages)
   and `GET /api/cron/daily-summary` (everything else: `info` events +
   overdue payments). Also gated by preferences.

**Templates:** `src/lib/email/templates/` — one shared branded layout
(`layout.ts`), then `welcome.ts`, `verifyEmail.ts`, `passwordReset.ts`,
`actionNotification.ts` (shared by every 📧 event — copy comes straight
from `EVENT_CATALOG`, never written separately), `messageDigest.ts`,
`dailySummary.ts`.

**Preferences:** `users.email_preferences` (jsonb), one boolean per
category in `PREFERENCE_CATEGORIES` (`src/lib/email/send.ts`): `messages`,
`offers`, `contracts`, `work`, `payments`, `daily_summary`. Managed at
`/settings` (both brand and creator) via `GET`/`PATCH
/api/account/email-preferences`, or via the signed-token unsubscribe link
in every non-security email's footer (`GET`/`POST /api/email/unsubscribe`
— works without logging in; the token carries its own `userId`, so it can
only ever change the preferences of whoever it was signed for).

**Daily quota (Resend free plan, 100/day):** `email_daily_usage` +
`increment_email_daily_count()` (atomic RPC). At 90+ sends today, any
`deferrable: true` send (everything except account/security) is skipped
— logged as `status: 'skipped'` and a Sentry warning — and picked up by
the next daily summary instead.

### Manual setup

- **Env vars** (`.env.example`): `RESEND_API_KEY`, `EMAIL_FROM`,
  `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`. Already set in this project's
  `.env.local`.
- **Run `supabase/phase6b_email_migration.sql`** before any of this works
  (`email_log`, token tables, `email_preferences`, the daily counter).
- **`vercel.json`** already schedules `daily-summary` at 13:00 UTC daily
  (Hobby plan's one-cron-a-day limit). Vercel automatically sends
  `Authorization: Bearer $CRON_SECRET` to its own cron invocations when
  `CRON_SECRET` is set as an env var — nothing further to configure for
  that one once it's deployed.
- **`message-digest` needs an external scheduler** (Hobby allows only one
  Vercel cron). Set up a free job at [cron-job.org](https://cron-job.org):
  - URL: `https://<your-domain>/api/cron/message-digest`
  - Schedule: every 15 minutes
  - Method: GET
  - Header: `Authorization: Bearer <your CRON_SECRET value>`

## Adding a new event

1. Add an entry to `EVENT_CATALOG` in `src/lib/events/catalog.ts` —
   `category`, `priority`, `title(data)`, `content(data)`.
2. Call `emitEvent()` (campaign-creator-scoped actions should go through
   `recordCampaignCreatorAction()` instead, which calls it for you and also
   posts the chat system message) with that `type` and whatever `data` the
   templates need.
3. Add a row to this file.
4. If a creator can ever receive it, double check the catalog template
   never references `charge_amount`/`profit`/`brand_notes`/`client_name`,
   and add a case to `scripts/security-check.mjs` if there's a realistic
   way the wrong recipient could end up on the list.
