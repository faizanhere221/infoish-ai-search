-- ============================================================================
-- DATABASE-BACKED RATE LIMITING
-- ============================================================================
-- Replaces the in-memory Map in src/lib/rate-limit.ts, which doesn't work
-- across Vercel's serverless instances (each cold start gets an empty store).
-- Fixed-window counter per (ip, endpoint), checked/incremented atomically in
-- a single plpgsql function so concurrent requests can't race past the limit.
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  ip            TEXT NOT NULL,
  endpoint      TEXT NOT NULL,
  window_start  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, endpoint)
);

-- Rows are short-lived (minutes); this keeps lookups fast without needing a
-- separate cleanup job for the common case.
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER,
  p_window_ms BIGINT
) RETURNS TABLE(allowed BOOLEAN, retry_after_ms BIGINT) AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_window_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  -- Row lock prevents two concurrent requests from both reading the same
  -- count and both thinking they're under the limit.
  SELECT window_start, request_count INTO v_window_start, v_count
  FROM rate_limits WHERE ip = p_ip AND endpoint = p_endpoint
  FOR UPDATE;

  IF NOT FOUND OR v_now > v_window_start + make_interval(secs => p_window_ms / 1000.0) THEN
    INSERT INTO rate_limits (ip, endpoint, window_start, request_count)
    VALUES (p_ip, p_endpoint, v_now, 1)
    ON CONFLICT (ip, endpoint) DO UPDATE SET window_start = v_now, request_count = 1;
    RETURN QUERY SELECT TRUE, 0::BIGINT;
    RETURN;
  END IF;

  IF v_count >= p_max_requests THEN
    RETURN QUERY SELECT FALSE,
      GREATEST(0, EXTRACT(EPOCH FROM (v_window_start + make_interval(secs => p_window_ms / 1000.0) - v_now)) * 1000)::BIGINT;
    RETURN;
  END IF;

  UPDATE rate_limits SET request_count = request_count + 1
  WHERE ip = p_ip AND endpoint = p_endpoint;
  RETURN QUERY SELECT TRUE, 0::BIGINT;
END;
$$ LANGUAGE plpgsql;
