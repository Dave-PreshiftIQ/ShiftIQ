-- =============================================================
-- PreShiftIQ / ShiftIQ Platform Schema
-- PostgreSQL 15+
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── ENUMS ──────────────────────────────────────────────────
CREATE TYPE user_role          AS ENUM ('admin', 'client', 'vendor');
CREATE TYPE session_status     AS ENUM ('draft', 'in_progress', 'submitted', 'matched', 'closed');
CREATE TYPE vendor_status      AS ENUM ('pending', 'under_review', 'active', 'inactive');
CREATE TYPE match_tier         AS ENUM ('strong', 'good', 'conditional', 'not_recommended');
CREATE TYPE question_type      AS ENUM ('single_select', 'multi_select', 'text', 'number', 'boolean', 'range', 'scale');
CREATE TYPE change_request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE notification_type  AS ENUM (
    'client_submitted',
    'vendor_submitted',
    'vendor_accepted_lead',
    'vendor_declined_lead',
    'client_answer_update',
    'vendor_answer_update',
    'match_created',
    'intro_sent'
);

-- ─── USERS ──────────────────────────────────────────────────
CREATE TABLE users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id     TEXT UNIQUE NOT NULL,
    name              TEXT NOT NULL,
    email             TEXT UNIQUE NOT NULL,
    phone             TEXT NOT NULL,
    company           TEXT NOT NULL,
    role              user_role NOT NULL,
    email_verified    BOOLEAN NOT NULL DEFAULT FALSE,
    email_domain      TEXT NOT NULL,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_role   ON users(role);
CREATE INDEX idx_users_domain ON users(email_domain);

-- ─── CLIENT SESSIONS ────────────────────────────────────────
CREATE TABLE client_sessions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    persona_tags     TEXT[] NOT NULL DEFAULT '{}',
    answers          JSONB NOT NULL DEFAULT '{}'::jsonb,
    tier1_completion NUMERIC(5,2) NOT NULL DEFAULT 0,
    tier2_unlocked   BOOLEAN NOT NULL DEFAULT FALSE,
    status           session_status NOT NULL DEFAULT 'draft',
    match_score      NUMERIC(5,2),
    submitted_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_client_sessions_user     ON client_sessions(user_id);
CREATE INDEX idx_client_sessions_status   ON client_sessions(status);
CREATE INDEX idx_client_sessions_personas ON client_sessions USING GIN (persona_tags);

-- ─── VENDOR RECORDS ─────────────────────────────────────────
CREATE TABLE vendor_records (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    audit_answers    JSONB NOT NULL DEFAULT '{}'::jsonb,
    match_criteria   JSONB NOT NULL DEFAULT '{}'::jsonb,
    status           vendor_status NOT NULL DEFAULT 'pending',
    audit_submitted_at TIMESTAMPTZ,
    audit_meeting_at TIMESTAMPTZ,
    activated_at     TIMESTAMPTZ,
    deactivated_at   TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_vendor_records_user     ON vendor_records(user_id);
CREATE INDEX idx_vendor_records_status   ON vendor_records(status);
CREATE INDEX idx_vendor_records_criteria ON vendor_records USING GIN (match_criteria);

-- ─── MATCH RESULTS ──────────────────────────────────────────
CREATE TABLE match_results (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_session_id    UUID NOT NULL REFERENCES client_sessions(id) ON DELETE CASCADE,
    vendor_id            UUID NOT NULL REFERENCES vendor_records(id) ON DELETE CASCADE,
    phase1_pass          BOOLEAN NOT NULL,
    score                JSONB NOT NULL,
    total_score          NUMERIC(5,2) NOT NULL,
    tier                 match_tier NOT NULL,
    vendor_notified_at   TIMESTAMPTZ,
    vendor_accepted      BOOLEAN NOT NULL DEFAULT FALSE,
    vendor_declined      BOOLEAN NOT NULL DEFAULT FALSE,
    accepted_at          TIMESTAMPTZ,
    declined_at          TIMESTAMPTZ,
    stripe_charge_id     TEXT,
    intro_sent_at        TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (client_session_id, vendor_id)
);
CREATE INDEX idx_match_results_session ON match_results(client_session_id);
CREATE INDEX idx_match_results_vendor  ON match_results(vendor_id);
CREATE INDEX idx_match_results_tier    ON match_results(tier);

-- ─── QUESTIONS ──────────────────────────────────────────────
CREATE TABLE questions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section       SMALLINT NOT NULL,
    tier          SMALLINT NOT NULL CHECK (tier IN (1, 2)),
    order_index   INT NOT NULL,
    text          TEXT NOT NULL,
    help_text     TEXT,
    type          question_type NOT NULL,
    options       JSONB,
    persona_tags  TEXT[] NOT NULL DEFAULT '{}',
    required      BOOLEAN NOT NULL DEFAULT TRUE,
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    weight        NUMERIC(5,2) NOT NULL DEFAULT 1.0,
    dimension     TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_questions_section_tier ON questions(section, tier);
CREATE INDEX idx_questions_active       ON questions(active);
CREATE INDEX idx_questions_personas     ON questions USING GIN (persona_tags);
CREATE INDEX idx_questions_dimension    ON questions(dimension);

-- ─── SCORING CONFIG ─────────────────────────────────────────
CREATE TABLE scoring_config (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dimension      TEXT UNIQUE NOT NULL,
    label          TEXT NOT NULL,
    weight         NUMERIC(5,2) NOT NULL,
    persona_boosts JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by     UUID REFERENCES users(id)
);

-- ─── ANSWER CHANGE REQUESTS ─────────────────────────────────
CREATE TABLE answer_change_requests (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_type   TEXT NOT NULL CHECK (session_type IN ('client', 'vendor')),
    session_id     UUID NOT NULL,
    section        SMALLINT NOT NULL,
    old_answers    JSONB NOT NULL,
    new_answers    JSONB NOT NULL,
    reason         TEXT,
    status         change_request_status NOT NULL DEFAULT 'pending',
    reviewed_at    TIMESTAMPTZ,
    reviewer_id    UUID REFERENCES users(id),
    reviewer_note  TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_acr_status ON answer_change_requests(status);
CREATE INDEX idx_acr_user   ON answer_change_requests(user_id);

-- ─── NOTIFICATIONS ──────────────────────────────────────────
CREATE TABLE notifications (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type          notification_type NOT NULL,
    payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
    read          BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notif_recipient_unread ON notifications(recipient_id, read);
CREATE INDEX idx_notif_type             ON notifications(type);

-- ─── AUDIT LOG ──────────────────────────────────────────────
CREATE TABLE audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id),
    action      TEXT NOT NULL,
    entity_type TEXT,
    entity_id   UUID,
    before      JSONB,
    after       JSONB,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_user   ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_time   ON audit_log(timestamp DESC);

-- ─── TRIGGERS ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated            BEFORE UPDATE ON users            FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_client_sessions_updated  BEFORE UPDATE ON client_sessions  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_vendor_records_updated   BEFORE UPDATE ON vendor_records   FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_questions_updated        BEFORE UPDATE ON questions        FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE OR REPLACE FUNCTION enforce_scoring_weights_sum() RETURNS TRIGGER AS $$
DECLARE
    total NUMERIC(6,2);
BEGIN
    SELECT COALESCE(SUM(weight), 0) INTO total FROM scoring_config;
    IF total <> 100 THEN
        RAISE EXCEPTION 'Scoring weights must sum to 100. Current total: %', total;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_scoring_sum
    AFTER INSERT OR UPDATE OR DELETE ON scoring_config
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION enforce_scoring_weights_sum();

-- ─── SEED DEFAULT SCORING CONFIG ────────────────────────────
BEGIN;
SET CONSTRAINTS trg_scoring_sum DEFERRED;

INSERT INTO scoring_config (dimension, label, weight, persona_boosts) VALUES
 ('D1', 'Persona Fit',              12, '{"broker":1.3}'),
 ('D2', 'Modal Depth',               15, '{"shipper":1.3}'),
 ('D3', 'Architecture / AI',         12, '{"carrier":1.3}'),
 ('D4', 'Integration',               15, '{"shipper":1.2,"broker":1.4,"carrier":1.4}'),
 ('D5', 'Security',                  10, '{}'),
 ('D6', 'Implementation Risk',       12, '{}'),
 ('D7', 'Commercial Transparency',   10, '{"pe":1.4}'),
 ('D8', 'Company Health',             8, '{"pe":1.3}'),
 ('D9', 'Client-Defined Weighting',   6, '{}');

COMMIT;
