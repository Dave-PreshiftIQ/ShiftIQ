import { Router } from 'express';
import { db } from '../../db';

const r = Router();

r.get('/clients', async (_req, res) => {
  const { rows } = await db.query(
    `SELECT u.id, u.name, u.email, u.company, u.created_at,
            cs.id AS session_id, cs.status AS session_status, cs.persona_tags, cs.submitted_at,
            cs.answers #>> '{_meta,match_hold}' AS held
     FROM users u
     LEFT JOIN LATERAL (
       SELECT * FROM client_sessions WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1
     ) cs ON TRUE
     WHERE u.role = 'client'
     ORDER BY u.created_at DESC`,
  );
  res.json({ clients: rows });
});

r.get('/vendors', async (req, res) => {
  const { status } = req.query;
  const params: any[] = [];
  const where = status ? (params.push(status), `WHERE vr.status = $1`) : '';
  const { rows } = await db.query(
    `SELECT u.id AS user_id, u.name, u.email, u.company,
            vr.id AS vendor_id, vr.status, vr.audit_submitted_at, vr.activated_at, vr.created_at
     FROM vendor_records vr JOIN users u ON u.id = vr.user_id
     ${where} ORDER BY vr.created_at DESC`,
    params,
  );
  res.json({ vendors: rows });
});

r.get('/matches', async (req, res) => {
  const { status } = req.query;
  let filter = '';
  if (status === 'pending')   filter = 'AND m.vendor_notified_at IS NOT NULL AND m.vendor_accepted = FALSE AND m.vendor_declined = FALSE';
  if (status === 'accepted')  filter = 'AND m.vendor_accepted = TRUE';
  if (status === 'declined')  filter = 'AND m.vendor_declined = TRUE';
  if (status === 'held')      filter = `AND cs.answers #>> '{_meta,match_hold}' = 'true'`;

  const { rows } = await db.query(
    `SELECT m.id, m.total_score, m.tier, m.vendor_accepted, m.vendor_declined,
            m.vendor_notified_at, m.accepted_at, m.intro_sent_at, m.stripe_charge_id,
            cu.company AS client_company, vu.company AS vendor_company,
            cs.id AS session_id
     FROM match_results m
     JOIN client_sessions cs ON cs.id = m.client_session_id
     JOIN users cu ON cu.id = cs.user_id
     JOIN vendor_records vr ON vr.id = m.vendor_id
     JOIN users vu ON vu.id = vr.user_id
     WHERE m.phase1_pass = TRUE ${filter}
     ORDER BY m.created_at DESC LIMIT 200`,
  );
  res.json({ matches: rows });
});

export default r;
