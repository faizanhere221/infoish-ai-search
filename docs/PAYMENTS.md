# Payments — design notes

This is payment **tracking**, not payment **processing**. Money moves
directly between a brand and a creator, outside Infoishai, using whatever
method they agree on (Wise, Payoneer, bank transfer, PayPal, or something
else). Infoishai keeps a record of what's owed, what's been marked paid,
and what the creator has confirmed receiving. No money ever touches this
app, and nothing here holds or moves funds.

## Why a provider interface exists

`src/lib/payments/provider.ts` defines a `PaymentProvider` interface with
one method per state change a payment record goes through:
`createPaymentRecord`, `markPaid`, `confirmReceived`, `dispute`, `cancel`.
Every API route calls these methods — none of them write to
`creator_payments` directly.

Today there is exactly one implementation, `ManualPaymentProvider`. Each
method is a plain database update. There is no external API call, no money
movement, nothing held in escrow. The brand says "I paid this" and the
creator says "I received this" — that's the whole manual flow.

The reason this is behind an interface at all, instead of routes just
calling Supabase directly, is Stripe Connect. When that gets built:

- A new `StripePaymentProvider` class would implement the same interface.
- `createPaymentRecord` would also create a Stripe `Transfer` (or
  `PaymentIntent`, depending on the Connect flow chosen) and store its id
  in the existing `reference` column — no schema change needed.
- `markPaid` would likely stop being brand-initiated and instead get called
  from a Stripe webhook handler when a transfer actually completes. The
  method would still exist and still return the same `PaymentRecord` shape;
  only what calls it changes.
- `confirmReceived`/`dispute` probably stay creator-initiated either way —
  Stripe doesn't know whether a creator is happy with what arrived.
- `cancel` would also need to reverse or cancel the Stripe-side transfer
  before updating the record.

Which provider is active would be a single swap (e.g. picking the
implementation based on an env var or a campaign-level setting) — routes,
the state-machine rules in `src/lib/payments/engine.ts`, and the UI would
not need to change, because they only ever talk to the `PaymentProvider`
interface, not to Supabase or Stripe directly.

## Where the business rules live vs. the provider

The provider is deliberately thin — it only knows "update this record to
this status." Everything about *when* a transition is allowed, *who* can
trigger it, and what side effects follow (event log, system message,
notification) lives in `src/lib/payments/engine.ts`, not the provider. That
split matters because those rules don't change when Stripe is added — a
creator still has to be the one who confirms receipt, a brand still can't
mark their own payment paid and also confirm it, regardless of which
provider is wired underneath.

## Encryption

Creator payout account details (bank info, Wise/Payoneer/PayPal email) are
encrypted at rest with AES-256-GCM (`src/lib/payments/crypto.ts`), using a
server-only `PAYOUT_ENCRYPTION_KEY`. The database only ever stores
ciphertext plus a plaintext `masked_preview` (e.g. "Wise ·
jo***@example.com") for list display. Decryption only happens for an
explicit "Reveal" request from an authorized party, and every reveal (and
every masked view) is logged to `campaign_creator_events`.

## What this explicitly does not do

- No card processing, no wallets, no balances, no held funds.
- No Stripe code or dependency exists yet — this phase only shapes the
  schema and interface so adding it later doesn't require reshaping
  anything already built.
- No automatic payouts. Every "paid" state is a brand saying so, and every
  "confirmed" state is a creator saying so.
