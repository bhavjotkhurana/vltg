-- The learning tables. Education data only.
--
-- Accounts, identity, and marketing tables are deliberately left out of this
-- writeup. The learner is shown here as an opaque reference (learner_ref) with
-- no personal fields, purely so the per-attempt data can be grouped.
--
-- Design notes that matter:
--  * Grading is server-side, so is_correct is trustworthy and the answer key
--    never reaches the browser.
--  * Every response is tagged to a skill, which is what makes the per-skill
--    diagnostic possible.
--  * The diagnosis is stored (not recomputed on every visit) so the report
--    loads instantly.

-- One row per completed attempt: the top-line outcome.
CREATE TABLE test_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_ref         UUID NOT NULL,          -- opaque; identity is out of scope here
  status              TEXT NOT NULL DEFAULT 'in_progress',
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  time_spent_seconds  INTEGER,
  math_raw            SMALLINT,               -- 0 to 33 correct
  reading_raw         SMALLINT,               -- 0 to 36 correct
  composite_score     NUMERIC(3,1)            -- 1.0 to 9.0 stanine estimate
);

-- One row per question answered: the raw material for everything downstream.
CREATE TABLE question_responses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  question_id         TEXT NOT NULL,
  skill_id            TEXT NOT NULL,          -- the skill this question tests
  section             TEXT NOT NULL CHECK (section IN ('math','reading')),
  answer_chosen       CHAR(1) CHECK (answer_chosen IN ('A','B','C','D')),
  is_correct          BOOLEAN,                -- graded server-side
  time_spent_seconds  INTEGER NOT NULL DEFAULT 0,
  answered_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, question_id)
);

-- The computed diagnosis, stored once per attempt.
CREATE TABLE diagnostic_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL UNIQUE REFERENCES test_sessions(id) ON DELETE CASCADE,
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  skill_scores      JSONB NOT NULL DEFAULT '{}',   -- { skill_id: {correct,total,pct}, ... }
  study_plan        JSONB NOT NULL DEFAULT '[]',   -- ordered [{skill, category, reason}, ...]
  prerequisite_gaps JSONB NOT NULL DEFAULT '[]',   -- [{skill, weak_prereqs:[...]}, ...]
  score_gap         SMALLINT                       -- distance from the learner's goal
);

-- The feedback loop: did the recommendation actually send someone to study?
CREATE TABLE resource_clicks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id   UUID REFERENCES test_sessions(id) ON DELETE SET NULL,
  skill_id     TEXT NOT NULL,       -- the skill gap the resource was for
  resource_url TEXT NOT NULL
);

CREATE INDEX idx_responses_skill      ON question_responses (skill_id);
CREATE INDEX idx_resource_clicks_skill ON resource_clicks (skill_id);
