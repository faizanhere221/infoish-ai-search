-- Supported platforms are now only YouTube, LinkedIn, Twitter/X, TikTok, and
-- Instagram (src/utils/constants.ts PLATFORMS). This removes data for every
-- other platform (github, newsletter, podcast, blog, twitch, discord, other,
-- and anything else). Idempotent, safe to re-run.
--
-- Run it in two parts in the Supabase SQL Editor (the editor only shows the
-- result of the last statement, so run PART 1 on its own first):
--   PART 1 — a read-only preview of what PART 2 deletes or changes.
--   PART 2 — the changes, in one transaction.
--
-- What PART 2 does NOT touch, on purpose: old deals, campaign_deliverables,
-- and creator_deliverables keep their platform value. The app shows a
-- platform it no longer supports as "Other platform" instead of failing.

-- ============================================================================
-- PART 1: PREVIEW (read-only). Select from here to the PART 2 line and run.
-- ============================================================================

WITH keep(platform) AS (
  VALUES ('youtube'), ('linkedin'), ('twitter'), ('tiktok'), ('instagram')
)
SELECT 'creator_platforms rows to delete' AS what, COUNT(*) AS how_many
FROM creator_platforms
WHERE lower(platform) NOT IN (SELECT platform FROM keep)
UNION ALL
SELECT 'creator_services rows to delete', COUNT(*)
FROM creator_services
WHERE platform IS NOT NULL AND lower(platform) NOT IN (SELECT platform FROM keep)
UNION ALL
SELECT 'creators whose total_followers changes', COUNT(*)
FROM creators c
WHERE c.total_followers IS DISTINCT FROM (
  SELECT COALESCE(SUM(cp.followers), 0)
  FROM creator_platforms cp
  WHERE cp.creator_id = c.id AND lower(cp.platform) IN (SELECT platform FROM keep)
)
UNION ALL
SELECT 'campaigns with a removed platform in targeting', COUNT(*)
FROM campaigns
WHERE EXISTS (
  SELECT 1 FROM unnest(platforms) AS p WHERE lower(p) NOT IN (SELECT platform FROM keep)
)
UNION ALL
SELECT 'campaign_deliverables on a removed platform (kept, shown neutrally)', COUNT(*)
FROM campaign_deliverables
WHERE lower(platform) NOT IN (SELECT platform FROM keep);

-- Breakdown by platform, if you want it (run on its own):
-- SELECT platform, COUNT(*) FROM creator_platforms
-- WHERE lower(platform) NOT IN ('youtube','linkedin','twitter','tiktok','instagram')
-- GROUP BY platform ORDER BY 2 DESC;

-- ============================================================================
-- PART 2: CHANGES. Select from here to the end and run.
-- ============================================================================

BEGIN;

-- 1. Platform rows for removed platforms.
DELETE FROM creator_platforms
WHERE lower(platform) NOT IN ('youtube', 'linkedin', 'twitter', 'tiktok', 'instagram');

-- 2. Services tied to a removed platform. Services with no platform
--    ("Any platform") stay.
DELETE FROM creator_services
WHERE platform IS NOT NULL
  AND lower(platform) NOT IN ('youtube', 'linkedin', 'twitter', 'tiktok', 'instagram');

-- 3. Recalculate total_followers for every creator from what's left
--    (0 when a creator has no platforms left).
UPDATE creators c
SET total_followers = totals.total
FROM (
  SELECT c2.id, COALESCE(SUM(cp.followers), 0) AS total
  FROM creators c2
  LEFT JOIN creator_platforms cp ON cp.creator_id = c2.id
  GROUP BY c2.id
) AS totals
WHERE totals.id = c.id
  AND c.total_followers IS DISTINCT FROM totals.total;

-- 4. Drop removed platforms from campaign targeting arrays, keeping order.
UPDATE campaigns
SET platforms = ARRAY(
  SELECT p
  FROM unnest(platforms) WITH ORDINALITY AS t(p, i)
  WHERE lower(p) IN ('youtube', 'linkedin', 'twitter', 'tiktok', 'instagram')
  ORDER BY i
)
WHERE EXISTS (
  SELECT 1 FROM unnest(platforms) AS p
  WHERE lower(p) NOT IN ('youtube', 'linkedin', 'twitter', 'tiktok', 'instagram')
);

COMMIT;
