-- The niche list is now these 24 (src/utils/constants.ts NICHES), stored as
-- the exact names below in creators.niches (TEXT[]) and campaigns.category.
-- campaigns.category used to hold its own slugs ('ai', 'saas', ...); it now
-- holds a niche name too. Idempotent, safe to re-run.
--
-- Mapping for values not in the new list (old -> new). Anything not listed
-- here and not already a current niche is removed (creators) or cleared to
-- NULL (campaigns; the app shows a NULL category as "Other").
--
--   campaigns.category slugs:
--     ai            -> AI & Machine Learning
--     saas          -> SaaS & Software
--     devtools      -> Developer Tools
--     cloud         -> Cloud & DevOps
--     devops        -> Cloud & DevOps
--     startup       -> Startup & Entrepreneurship
--     fintech       -> Fintech
--     cybersecurity -> Cybersecurity
--     ecommerce     -> E-commerce Tech
--     productivity, marketing, other -> cleared (no obvious match)
--
--   older creator niche spellings:
--     AI/ML, AI, Machine Learning -> AI & Machine Learning
--     Generative AI, LLMs         -> Generative AI & LLMs
--     SaaS, Software              -> SaaS & Software
--     DevTools                    -> Developer Tools
--     Cloud, DevOps               -> Cloud & DevOps
--     Web Dev                     -> Web Development
--     Mobile, Mobile Dev          -> Mobile Development
--     No-Code, Low-Code           -> No-Code & Low-Code
--     Startups, Startup           -> Startup & Entrepreneurship
--     Blockchain, Web3, Crypto    -> Blockchain & Web3
--     Design, UI/UX               -> UI/UX & Product Design
--     Gadgets, Consumer Tech      -> Consumer Tech & Gadgets
--     E-commerce, Ecommerce       -> E-commerce Tech
--     Open Source                 -> Open Source (already current)
--     Gaming, Finance, Marketing, Productivity, anything else -> removed
--
-- Run it in two parts in the Supabase SQL Editor (the editor only shows the
-- result of the last statement):
--   PART 1 — read-only preview. Run on its own first.
--   PART 2 — the changes, in one transaction.

-- ============================================================================
-- PART 1: PREVIEW (read-only). Select from here to the PART 2 line and run.
-- ============================================================================

WITH valid(name) AS (
  VALUES ('AI & Machine Learning'), ('Generative AI & LLMs'), ('AI Tools & Automation'),
         ('SaaS & Software'), ('Developer Tools'), ('Cloud & DevOps'), ('Cybersecurity'),
         ('Data Science'), ('Web Development'), ('Mobile Development'), ('No-Code & Low-Code'),
         ('Startup & Entrepreneurship'), ('Product Management'), ('Tech News & Reviews'),
         ('Programming Tutorials'), ('Consumer Tech & Gadgets'), ('PC Hardware & Gaming Tech'),
         ('Blockchain & Web3'), ('Fintech'), ('UI/UX & Product Design'), ('Open Source'),
         ('Tech Careers & Education'), ('Robotics & IoT'), ('E-commerce Tech')
),
niche_map(old, new) AS (
  VALUES ('AI/ML', 'AI & Machine Learning'), ('AI', 'AI & Machine Learning'),
         ('Machine Learning', 'AI & Machine Learning'),
         ('Generative AI', 'Generative AI & LLMs'), ('LLMs', 'Generative AI & LLMs'),
         ('SaaS', 'SaaS & Software'), ('Software', 'SaaS & Software'),
         ('DevTools', 'Developer Tools'),
         ('Cloud', 'Cloud & DevOps'), ('DevOps', 'Cloud & DevOps'),
         ('Web Dev', 'Web Development'),
         ('Mobile', 'Mobile Development'), ('Mobile Dev', 'Mobile Development'),
         ('No-Code', 'No-Code & Low-Code'), ('Low-Code', 'No-Code & Low-Code'),
         ('Startups', 'Startup & Entrepreneurship'), ('Startup', 'Startup & Entrepreneurship'),
         ('Blockchain', 'Blockchain & Web3'), ('Web3', 'Blockchain & Web3'), ('Crypto', 'Blockchain & Web3'),
         ('Design', 'UI/UX & Product Design'), ('UI/UX', 'UI/UX & Product Design'),
         ('Gadgets', 'Consumer Tech & Gadgets'), ('Consumer Tech', 'Consumer Tech & Gadgets'),
         ('E-commerce', 'E-commerce Tech'), ('Ecommerce', 'E-commerce Tech')
),
category_map(old, new) AS (
  VALUES ('ai', 'AI & Machine Learning'), ('saas', 'SaaS & Software'),
         ('devtools', 'Developer Tools'), ('cloud', 'Cloud & DevOps'), ('devops', 'Cloud & DevOps'),
         ('startup', 'Startup & Entrepreneurship'), ('fintech', 'Fintech'),
         ('cybersecurity', 'Cybersecurity'), ('ecommerce', 'E-commerce Tech')
)
SELECT 'creator niche' AS kind, t.v AS old_value,
       COALESCE(m.new, '(removed)') AS new_value, COUNT(*) AS creators
FROM creators c
CROSS JOIN LATERAL unnest(c.niches) AS t(v)
LEFT JOIN niche_map m ON m.old = t.v
WHERE t.v NOT IN (SELECT name FROM valid)
GROUP BY t.v, m.new
UNION ALL
SELECT 'campaign category', c.category,
       COALESCE(m.new, '(cleared to NULL)'), COUNT(*)
FROM campaigns c
LEFT JOIN category_map m ON m.old = c.category
WHERE c.category IS NOT NULL AND c.category NOT IN (SELECT name FROM valid)
GROUP BY c.category, m.new
ORDER BY 1, 2;

-- ============================================================================
-- PART 2: CHANGES. Select from here to the end and run.
-- ============================================================================

BEGIN;

CREATE TEMP TABLE _valid_niches(name TEXT PRIMARY KEY) ON COMMIT DROP;
INSERT INTO _valid_niches VALUES
  ('AI & Machine Learning'), ('Generative AI & LLMs'), ('AI Tools & Automation'),
  ('SaaS & Software'), ('Developer Tools'), ('Cloud & DevOps'), ('Cybersecurity'),
  ('Data Science'), ('Web Development'), ('Mobile Development'), ('No-Code & Low-Code'),
  ('Startup & Entrepreneurship'), ('Product Management'), ('Tech News & Reviews'),
  ('Programming Tutorials'), ('Consumer Tech & Gadgets'), ('PC Hardware & Gaming Tech'),
  ('Blockchain & Web3'), ('Fintech'), ('UI/UX & Product Design'), ('Open Source'),
  ('Tech Careers & Education'), ('Robotics & IoT'), ('E-commerce Tech');

CREATE TEMP TABLE _niche_map(old TEXT PRIMARY KEY, new TEXT NOT NULL) ON COMMIT DROP;
INSERT INTO _niche_map VALUES
  ('AI/ML', 'AI & Machine Learning'), ('AI', 'AI & Machine Learning'),
  ('Machine Learning', 'AI & Machine Learning'),
  ('Generative AI', 'Generative AI & LLMs'), ('LLMs', 'Generative AI & LLMs'),
  ('SaaS', 'SaaS & Software'), ('Software', 'SaaS & Software'),
  ('DevTools', 'Developer Tools'),
  ('Cloud', 'Cloud & DevOps'), ('DevOps', 'Cloud & DevOps'),
  ('Web Dev', 'Web Development'),
  ('Mobile', 'Mobile Development'), ('Mobile Dev', 'Mobile Development'),
  ('No-Code', 'No-Code & Low-Code'), ('Low-Code', 'No-Code & Low-Code'),
  ('Startups', 'Startup & Entrepreneurship'), ('Startup', 'Startup & Entrepreneurship'),
  ('Blockchain', 'Blockchain & Web3'), ('Web3', 'Blockchain & Web3'), ('Crypto', 'Blockchain & Web3'),
  ('Design', 'UI/UX & Product Design'), ('UI/UX', 'UI/UX & Product Design'),
  ('Gadgets', 'Consumer Tech & Gadgets'), ('Consumer Tech', 'Consumer Tech & Gadgets'),
  ('E-commerce', 'E-commerce Tech'), ('Ecommerce', 'E-commerce Tech');

-- 1. Creator niches: map old spellings, drop anything else not current,
--    de-duplicate, keep the creator's order.
UPDATE creators c
SET niches = cleaned.niches
FROM (
  SELECT c2.id, ARRAY(
    SELECT x.n
    FROM (
      SELECT COALESCE(m.new, v.name) AS n, MIN(t.i) AS first_i
      FROM unnest(c2.niches) WITH ORDINALITY AS t(v, i)
      LEFT JOIN _niche_map m ON m.old = t.v
      LEFT JOIN _valid_niches v ON v.name = t.v
      GROUP BY 1
    ) x
    WHERE x.n IS NOT NULL
    ORDER BY x.first_i
  ) AS niches
  FROM creators c2
  WHERE c2.niches IS NOT NULL
) AS cleaned
WHERE cleaned.id = c.id
  AND c.niches IS DISTINCT FROM cleaned.niches;

-- 2. Campaign categories: old slugs to niche names.
UPDATE campaigns SET category = CASE category
  WHEN 'ai' THEN 'AI & Machine Learning'
  WHEN 'saas' THEN 'SaaS & Software'
  WHEN 'devtools' THEN 'Developer Tools'
  WHEN 'cloud' THEN 'Cloud & DevOps'
  WHEN 'devops' THEN 'Cloud & DevOps'
  WHEN 'startup' THEN 'Startup & Entrepreneurship'
  WHEN 'fintech' THEN 'Fintech'
  WHEN 'cybersecurity' THEN 'Cybersecurity'
  WHEN 'ecommerce' THEN 'E-commerce Tech'
END
WHERE category IS NOT NULL
  AND category NOT IN (SELECT name FROM _valid_niches);

COMMIT;
