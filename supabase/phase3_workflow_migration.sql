-- ============================================================================
-- PHASE 3 — NEGOTIATIONS, DELIVERABLES + APPROVALS, SCHEDULING
-- Run this entire file once in the Supabase SQL Editor, top to bottom.
-- Every statement is idempotent (IF EXISTS / IF NOT EXISTS) so it is safe to
-- re-run if a prior attempt was interrupted partway through.
--
-- Id convention: VARCHAR(255) with DEFAULT (uuid_generate_v4())::text, same
-- as Phase 2's campaign_creators/campaign_share_links.
--
-- All new tables are built on campaign_creators (Phase 2), NOT the legacy
-- deals table — per instruction, this phase does not touch or extend the
-- deals flow at all.
-- ============================================================================


-- ============================================================================
-- TABLES (created first; the accept-offer function below writes to
-- creator_deliverables, so that table must exist before it's defined)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- campaign_offers — negotiation thread for one campaign_creators row.
-- "Only one pending offer per row" is enforced at the DB level by the
-- partial unique index below, not just in application code.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS campaign_offers (
  id VARCHAR(255) PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  campaign_creator_id VARCHAR(255) NOT NULL REFERENCES campaign_creators(id) ON DELETE CASCADE,

  from_party VARCHAR(10) NOT NULL, -- 'brand' | 'creator'
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  deliverables_summary TEXT,
  publish_by DATE,
  revisions_included INTEGER DEFAULT 0,
  usage_rights TEXT,
  message TEXT,

  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- 'pending' | 'accepted' | 'declined' | 'countered' | 'withdrawn' | 'expired'
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_campaign_offers_row ON campaign_offers(campaign_creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_offers_status ON campaign_offers(status);

-- Only one PENDING offer per row at a time, enforced by Postgres itself.
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_offers_one_pending
  ON campaign_offers(campaign_creator_id) WHERE status = 'pending';

ALTER TABLE campaign_offers ENABLE ROW LEVEL SECURITY;
-- No permissive policy, consistent with every table added since the Phase 1
-- security cleanup: the service-role key (used by every API route) bypasses
-- RLS regardless of policy, and nothing in the frontend uses the anon key.


-- ---------------------------------------------------------------------------
-- creator_deliverables — one row per deliverable (e.g. one video, one
-- thread) for a campaign_creators row, with its own draft/approval cycle.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS creator_deliverables (
  id VARCHAR(255) PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  campaign_creator_id VARCHAR(255) NOT NULL REFERENCES campaign_creators(id) ON DELETE CASCADE,

  title VARCHAR(255) NOT NULL,
  platform VARCHAR(50),
  format VARCHAR(50), -- 'video' | 'post' | 'thread' | 'newsletter' | 'story' | 'podcast' | 'other'

  draft_due DATE,
  publish_due DATE,

  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  -- 'pending' | 'draft_submitted' | 'changes_requested' | 'approved' | 'posted' | 'completed'

  draft_url TEXT,
  draft_attachment_path TEXT,
  posted_url TEXT,

  revisions_used INTEGER NOT NULL DEFAULT 0,
  revisions_allowed INTEGER NOT NULL DEFAULT 2,
  latest_feedback TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_deliverables_row ON creator_deliverables(campaign_creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_deliverables_status ON creator_deliverables(status);
CREATE INDEX IF NOT EXISTS idx_creator_deliverables_draft_due ON creator_deliverables(draft_due);
CREATE INDEX IF NOT EXISTS idx_creator_deliverables_publish_due ON creator_deliverables(publish_due);

DROP TRIGGER IF EXISTS update_creator_deliverables_updated_at ON creator_deliverables;
CREATE TRIGGER update_creator_deliverables_updated_at BEFORE UPDATE ON creator_deliverables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE creator_deliverables ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- campaign_creator_events — append-only activity log for a tracker row
-- (every offer and deliverable action), written from application code (each
-- event records who/what/when/payload; the API route already knows the
-- authenticated actor, which a DB trigger would not).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS campaign_creator_events (
  id VARCHAR(255) PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  campaign_creator_id VARCHAR(255) NOT NULL REFERENCES campaign_creators(id) ON DELETE CASCADE,

  actor_user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_type VARCHAR(10) NOT NULL, -- 'brand' | 'creator'
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_creator_events_row ON campaign_creator_events(campaign_creator_id, created_at DESC);

ALTER TABLE campaign_creator_events ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- campaign_creators: status_locked — set true the moment a brand manually
-- changes a row's status (via the existing PUT/bulk-status routes from
-- Phase 2). While true, the deliverable auto-sync trigger below leaves
-- status alone, so a manual override isn't silently clobbered by the next
-- deliverable event. The brand can still change status freely at any time;
-- this only stops the *automatic* sync from overwriting their choice again.
-- ---------------------------------------------------------------------------

ALTER TABLE campaign_creators ADD COLUMN IF NOT EXISTS status_locked BOOLEAN NOT NULL DEFAULT FALSE;


-- ---------------------------------------------------------------------------
-- creators: availability, for the scheduling warnings on the offer form.
-- ---------------------------------------------------------------------------

ALTER TABLE creators ADD COLUMN IF NOT EXISTS availability_status VARCHAR(20) NOT NULL DEFAULT 'open';
-- 'open' | 'limited' | 'booked'
ALTER TABLE creators ADD COLUMN IF NOT EXISTS min_lead_days INTEGER NOT NULL DEFAULT 0;


-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Accepting an offer must, in one atomic step: mark the offer accepted, copy
-- its terms onto campaign_creators (payout/currency/planned date/status),
-- and create the first deliverable from it. A plpgsql function body is a
-- single transaction, so a failure partway through rolls everything back —
-- the tracker row is never left pointing at an "accepted" offer that didn't
-- actually update anything.
CREATE OR REPLACE FUNCTION accept_campaign_offer(p_offer_id VARCHAR(255))
RETURNS TABLE (
  campaign_creator_id VARCHAR(255),
  deliverable_id VARCHAR(255)
) AS $$
DECLARE
  v_offer campaign_offers%ROWTYPE;
  v_deliverable_id VARCHAR(255);
BEGIN
  SELECT * INTO v_offer FROM campaign_offers WHERE id = p_offer_id AND status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer % is not pending', p_offer_id;
  END IF;

  UPDATE campaign_offers
  SET status = 'accepted', responded_at = NOW()
  WHERE id = p_offer_id;

  UPDATE campaign_creators
  SET payout_amount = v_offer.amount,
      currency = v_offer.currency,
      planned_date = COALESCE(v_offer.publish_by, planned_date),
      status = 'confirmed',
      status_locked = FALSE,
      updated_at = NOW()
  WHERE id = v_offer.campaign_creator_id;

  INSERT INTO creator_deliverables (campaign_creator_id, title, publish_due, revisions_allowed, status)
  VALUES (
    v_offer.campaign_creator_id,
    COALESCE(NULLIF(TRIM(v_offer.deliverables_summary), ''), 'Deliverable'),
    v_offer.publish_by,
    GREATEST(COALESCE(v_offer.revisions_included, 0), 0),
    'pending'
  )
  RETURNING id INTO v_deliverable_id;

  RETURN QUERY SELECT v_offer.campaign_creator_id, v_deliverable_id;
END;
$$ LANGUAGE plpgsql;

-- Auto-syncs campaign_creators.status from the least-progressed deliverable
-- it has, so the tracker reflects reality without the brand re-clicking a
-- status dropdown after every deliverable event. Skipped entirely once the
-- brand has manually overridden the status (status_locked = true).
CREATE OR REPLACE FUNCTION sync_campaign_creator_status()
RETURNS TRIGGER AS $$
DECLARE
  v_row_id VARCHAR(255);
  v_locked BOOLEAN;
  v_min_rank INTEGER;
  v_new_status VARCHAR(50);
BEGIN
  v_row_id := COALESCE(NEW.campaign_creator_id, OLD.campaign_creator_id);

  SELECT status_locked INTO v_locked FROM campaign_creators WHERE id = v_row_id;
  IF v_locked IS NOT FALSE THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT MIN(
    CASE status
      WHEN 'pending' THEN 0
      WHEN 'changes_requested' THEN 0
      WHEN 'draft_submitted' THEN 1
      WHEN 'approved' THEN 2
      WHEN 'posted' THEN 3
      WHEN 'completed' THEN 4
      ELSE 0
    END
  ) INTO v_min_rank
  FROM creator_deliverables
  WHERE campaign_creator_id = v_row_id;

  IF v_min_rank IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_new_status := CASE v_min_rank
    WHEN 0 THEN 'drafting'
    WHEN 1 THEN 'draft_review'
    WHEN 2 THEN 'scheduled'
    WHEN 3 THEN 'posted'
    WHEN 4 THEN 'completed'
  END;

  UPDATE campaign_creators
  SET status = v_new_status, updated_at = NOW()
  WHERE id = v_row_id AND status IS DISTINCT FROM v_new_status;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS creator_deliverables_sync_status ON creator_deliverables;
CREATE TRIGGER creator_deliverables_sync_status
  AFTER INSERT OR UPDATE OR DELETE ON creator_deliverables
  FOR EACH ROW EXECUTE FUNCTION sync_campaign_creator_status();


-- ============================================================================
-- STORAGE — 'deliverables' bucket
--
-- Same approach as chat-attachments (Phase 1): private bucket, 10MB limit,
-- same allowed MIME types, served only through a signed-URL endpoint after a
-- membership check (brand owner or the row's creator). If your Supabase
-- plan/role blocks writing to storage.buckets directly, create it instead
-- via Dashboard -> Storage -> New bucket with these same settings: name
-- "deliverables", Private, 10MB limit, same MIME type list.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deliverables',
  'deliverables',
  FALSE,
  10485760, -- 10MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
