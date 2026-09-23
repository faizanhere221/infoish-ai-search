# Referral Partner System

Partners (affiliates) get a unique referral link. Creators who sign up through
that link are tracked, and the referring partner earns a commission when
those creators complete paid deals on the platform.

## How it works (flow)

```
1. Admin creates a partner
   POST /api/admin/partners  ->  referral_partners row (status: active,
   referral_code, commission_rate)

2. Partner shares their link
   https://infoishai.com/signup/creator?ref=CODE

3. A visitor lands on /signup/creator?ref=CODE
   -> the page looks up the partner (GET /api/referral/lookup) and shows
      "You were invited by [Partner Name]"
   -> the code is stored in a cookie + localStorage (30 days,
      infoishai_ref) via src/lib/referral-tracking.ts

4. Visitor completes signup (POST /api/auth/register)
   -> immediately after, the client calls POST /api/referral/track with
      the stored code + the new user's id/email/name
   -> a referral_signups row is created (status: signed_up), and
      referral_partners.total_referrals is incremented via a DB trigger
   -> the cookie is cleared

5. Visitor creates their creator profile (POST /api/creators)
   -> updateReferralOnProfileComplete() links referral_signups
      .referred_creator_id to the new creator and advances status to
      profile_complete

6. Creator completes a paid deal (POST /api/deals/[id]/approve, brand
   approves delivery)
   -> calculateReferralCommission() runs:
      - is this creator referred? is the partner active? has this deal
        already been paid a commission? is the deal amount > 0?
      - if all pass: creates a referral_commissions row (status: pending)
        for 5% of the deal amount (the platform fee), times the partner's
        commission rate
      - referral_signups.status advances to first_deal (or active on a
        2nd+ completed deal)
      - the partner is notified

7. Admin reviews and approves the commission
   PUT /api/admin/partners/[id]/commissions { commissionId, status:
   'approved' }
   -> only approved/paid commissions count toward the partner's earnings
   -> the partner is notified

8. Admin pays the partner and records it
   POST /api/admin/partners/[id]/payouts { amount_cents, ... }
   -> created with status: completed, which increments
      referral_partners.total_paid_cents via a DB trigger
```

## Referral link format

```
https://infoishai.com/signup/creator?ref=PARTNER_CODE
```

Example: `https://infoishai.com/signup/creator?ref=mocrypto`

`PARTNER_CODE` is `referral_partners.referral_code` — 5-30 lowercase
letters, numbers, and hyphens (`src/lib/referral.ts:isValidReferralCode`).
It is unique across all partners.

## Commission calculation

Commission is a percentage of Infoishai's platform fee, **not** of the raw
deal amount:

```
platform_fee_cents   = round(deal_amount_cents * PLATFORM_FEE_RATE)   // 5%
commission_amount_cents = round(platform_fee_cents * (commission_rate / 100))
```

`PLATFORM_FEE_RATE` (currently `0.05`, i.e. 5%) is defined in
`src/lib/referral-commissions.ts`. `commission_rate` is per-partner,
set on `referral_partners.commission_rate` (default 20%).

**Worked examples:**

| Deal amount | Platform fee (5%) | Partner rate | Partner gets |
|---|---|---|---|
| $100 | $5.00 | 20% | $1.00 |
| $100 | $5.00 | 50% | $2.50 |
| $500 | $25.00 | 50% | $12.50 |

Both `deal_amount_cents` and `platform_fee_cents` are stored on the
commission record alongside `commission_amount_cents`, so the full
calculation is auditable after the fact.

**Edge cases** (all handled silently — none of these are errors):
- Creator wasn't referred by anyone → no commission created.
- Referring partner is `paused` or `deactivated` → no commission created.
- This deal already has a commission (re-approval, re-run, etc.) → skipped,
  never duplicated.
- Deal amount is $0 (free deal) → no commission created.
- Any unexpected DB failure is caught, logged, and **never blocks deal
  completion** — the brand's approval always succeeds even if commission
  bookkeeping fails.

## Status progressions

### Partner (`referral_partners.status`)
```
active  <->  paused           (reversible, admin toggles anytime)
active  -->  deactivated       (soft delete — referral link stops working,
                                 but all history is kept; not currently
                                 reversible through the admin UI, though
                                 the API allows setting status back to
                                 active via the edit form)
```
A `paused`/`deactivated` partner still shows all their historical data, but
`calculateReferralCommission` refuses to create new commissions for them.

### Referral signup (`referral_signups.status`)
```
signed_up  -->  profile_complete  -->  first_deal  -->  active
```
Enforced one-directional by `updateReferralSignupStatus()` — it will never
move a signup backwards, even if called with an "earlier" status by
mistake. Transitions:
- `signed_up`: set at signup (`POST /api/referral/track`).
- `profile_complete`: set when the creator profile is created
  (`updateReferralOnProfileComplete`, called from `POST /api/creators`).
- `first_deal`: set on their first completed, commission-eligible deal.
- `active`: set on their second (or later) completed, commission-eligible
  deal.

### Commission (`referral_commissions.status`)
```
pending  -->  approved  -->  paid   (paid is defined in the schema but
                                      nothing currently transitions a
                                      commission to it — see Known Issues)
pending  -->  cancelled              (terminal)
```
Only `approved` and `paid` commissions count toward a partner's earnings
(`getPartnerStats` sums `commission_amount_cents` where status is one of
those two). `pending` commissions are visible but not yet counted.

### Payout (`referral_payouts.status`)
```
pending / processing / completed / failed
```
The schema supports all four, but the only thing currently creating
payouts — the admin "Record Payout" form — always creates them as
`completed` immediately (it represents an admin logging a transfer that
already happened). `referral_partners.total_paid_cents` only increments
for `completed` payouts (DB trigger).

## Admin workflows

All at `/admin/partners` (list) and `/admin/partners/[id]` (detail).

- **Create a partner**: "Add Partner" on the list page. Name + email
  required; referral code auto-suggested from the name (editable, checked
  for uniqueness live); commission rate defaults to 20%; optionally link
  to an existing user account (search by email).
- **Edit a partner**: "Edit" on the detail page — inline form for name,
  email, commission rate, and status.
- **Pause / Activate**: one-click buttons on the detail page header.
- **Deactivate**: same header, with a confirmation modal (soft delete —
  history is preserved, FK cascade is never triggered since the row is
  never actually deleted).
- **Approve / Cancel a commission**: on the Commissions tab, per pending
  row. Cancelling asks for confirmation first.
- **Record a payout**: on the Payouts tab, "Record Payout" (disabled if
  pending balance is $0). Amount is capped client-side to the current
  pending balance.

## API endpoints summary

### Public (no auth)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/referral/lookup?code=X` | Look up a partner's name by referral code (for the signup banner) |
| POST | `/api/referral/track` | Record a referral signup against a code |

### Partner (auth required, caller must have a `referral_partners` row)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/referral/me` | The caller's own partner record |
| GET | `/api/referral/stats` | Dashboard stats (referrals, active creators, earnings, pending payout) |
| GET | `/api/referral/referrals` | The caller's referred signups, with per-signup deal/earnings totals |
| GET | `/api/referral/commissions` | The caller's commissions, with creator + deal info |
| GET | `/api/referral/payouts` | The caller's payout history |

### Admin (auth required, role `admin`/`super_admin`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/partners` | List partners (search, status filter, sort, pagination, aggregate summary) |
| POST | `/api/admin/partners` | Create a partner |
| GET | `/api/admin/partners/[id]` | Partner detail + computed stats + recent signups |
| PUT | `/api/admin/partners/[id]` | Update name/email/commission_rate/status/referral_code |
| DELETE | `/api/admin/partners/[id]` | Deactivate (soft delete) |
| GET | `/api/admin/partners/[id]/referrals` | That partner's referred signups |
| GET | `/api/admin/partners/[id]/commissions` | That partner's commissions |
| PUT | `/api/admin/partners/[id]/commissions` | Approve or cancel a pending commission (`{ commissionId, status }`) |
| GET | `/api/admin/partners/[id]/payouts` | That partner's payout history |
| POST | `/api/admin/partners/[id]/payouts` | Record a new payout |

### Deal-completion hook (not a referral endpoint, but where commissions originate)
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/deals/[id]/approve` | Brand approves delivery → deal completes → `calculateReferralCommission()` runs as a side effect |

## Pages

| Route | Access | Purpose |
|---|---|---|
| `/signup/creator?ref=CODE` | Public | Creator signup, shows the referral banner when a valid code is present |
| `/dashboard/partner` | Logged-in partner | Partner's own dashboard: stats, referral link, Referrals/Commissions/Payouts tabs |
| `/admin/partners` | Admin | Partner list, search/filter/sort, add partner |
| `/admin/partners/[id]` | Admin | Partner detail: edit, status actions, stats, tabs, record payout, approve/cancel commissions |

## Known issues / future improvements

- **`paid` commission status is unreachable.** Nothing currently transitions
  a commission from `approved` to `paid` — there's no linkage between a
  recorded payout and the specific commissions it covers. Payouts and
  earnings are tracked as running totals (earned vs. paid), not
  commission-by-commission reconciliation. A future phase could add a
  payout-to-commissions join table, or auto-mark the oldest `approved`
  commissions as `paid` up to the payout amount.
- **`pending`/`processing`/`failed` payout statuses are unreachable** for
  the same reason — the only payout-creation path (admin "Record Payout")
  always writes `completed`. The schema supports a real pending → completed
  workflow if one is needed later (e.g. integrating an actual payment
  provider).
- **Deactivated → active is possible but not obviously surfaced.** The
  detail page's inline edit form lets an admin set status back to `active`
  from `deactivated`, but there's no dedicated "Reactivate" button the way
  there is for `paused` (the header only shows Pause/Activate/Deactivate
  based on current status, and `deactivated` partners see an "Activate"
  button too — this does work, just isn't visually distinguished from
  reactivating a merely-paused partner).
- **LinkedIn share pre-fill is best-effort.** LinkedIn's official share
  endpoint only reads the `url` parameter and scrapes Open Graph tags for
  the rest; the `title`/`summary` params sent by the Share dropdown may be
  ignored depending on how LinkedIn is rendering shares at any given time.
- **No creator-facing indication that they were referred**, beyond the
  one-time signup banner. There's no "referred by X" badge on their
  ongoing profile or dashboard.
- **No commission-rate history.** If an admin changes a partner's
  `commission_rate`, it applies going forward only (commissions already
  created keep the rate they were calculated with, stored on the record) —
  but there's no audit log of when/why a rate changed.
