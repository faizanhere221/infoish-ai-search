-- Fixes a bug found while testing the guided-workflow UX changes: offer
-- acceptance never actually left a row on 'confirmed'.
--
-- accept_campaign_offer() UPDATEs campaign_creators to status='confirmed',
-- status_locked=FALSE, THEN inserts the new creator_deliverables row. That
-- insert fires the creator_deliverables_sync_status trigger (added in
-- phase3_workflow_migration.sql), which re-reads status_locked (now FALSE,
-- since the update above already ran in the same transaction), sees one
-- 'pending' deliverable, and overwrites status back to 'drafting' before
-- the function even returns. So every offer acceptance silently landed on
-- 'drafting' instead of 'confirmed' — and if the row had been manually
-- locked, the unlock "stuck" but the status change was immediately undone
-- by the same transaction.
--
-- Fix: reorder so the campaign_creators UPDATE is the LAST write in the
-- function, after the deliverable insert (and the trigger it fires). Same
-- values as before, just moved — this is the write that's meant to win.
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

  INSERT INTO creator_deliverables (campaign_creator_id, title, publish_due, revisions_allowed, status)
  VALUES (
    v_offer.campaign_creator_id,
    COALESCE(NULLIF(TRIM(v_offer.deliverables_summary), ''), 'Deliverable'),
    v_offer.publish_by,
    GREATEST(COALESCE(v_offer.revisions_included, 0), 0),
    'pending'
  )
  RETURNING id INTO v_deliverable_id;

  -- Runs after the insert above (and the auto-sync trigger it fires), so
  -- this is the write that actually sticks: offer acceptance is a real
  -- workflow event and must move the row to 'confirmed' and clear any
  -- manual lock, not get silently reverted to 'drafting'.
  UPDATE campaign_creators
  SET payout_amount = v_offer.amount,
      currency = v_offer.currency,
      planned_date = COALESCE(v_offer.publish_by, planned_date),
      status = 'confirmed',
      status_locked = FALSE,
      updated_at = NOW()
  WHERE id = v_offer.campaign_creator_id;

  RETURN QUERY SELECT v_offer.campaign_creator_id, v_deliverable_id;
END;
$$ LANGUAGE plpgsql;

-- One-time backfill: any row an earlier (buggy) acceptance already landed
-- on 'drafting' with a single still-'pending' deliverable and an
-- 'accepted' offer, and that a human hasn't touched since (status_locked
-- is FALSE — if a brand manually set a status after the fact, leave it
-- alone). Safe to run more than once; it only touches rows matching this
-- exact signature.
UPDATE campaign_creators cc
SET status = 'confirmed', updated_at = NOW()
WHERE cc.status = 'drafting'
  AND cc.status_locked = FALSE
  AND EXISTS (
    SELECT 1 FROM campaign_offers co
    WHERE co.campaign_creator_id = cc.id AND co.status = 'accepted'
  )
  AND (SELECT COUNT(*) FROM creator_deliverables cd WHERE cd.campaign_creator_id = cc.id) = 1
  AND EXISTS (
    SELECT 1 FROM creator_deliverables cd WHERE cd.campaign_creator_id = cc.id AND cd.status = 'pending'
  );
