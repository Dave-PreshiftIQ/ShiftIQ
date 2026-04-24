-- Anonymized client card view that the vendor sees before accepting.
-- SELECT-only. Contains no user_id, email, company, name.
CREATE OR REPLACE VIEW vendor_lead_card_view AS
SELECT
  m.id                                AS match_id,
  m.client_session_id,
  m.vendor_id,
  m.total_score,
  m.tier,
  m.score                             AS score_breakdown,
  m.vendor_accepted,
  m.accepted_at,
  m.vendor_notified_at,
  cs.persona_tags,
  cs.answers -> 'freight_spend_range'  AS freight_spend_range,
  cs.answers -> 'modes_required'       AS modes,
  cs.answers -> 'current_systems'      AS current_systems,
  cs.answers -> 'watch_points'         AS watch_points
FROM match_results m
JOIN client_sessions cs ON cs.id = m.client_session_id
WHERE m.phase1_pass = TRUE AND m.tier <> 'not_recommended';
