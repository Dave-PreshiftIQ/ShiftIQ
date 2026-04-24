import { Router } from 'express';
import { db } from '../../db';

const r = Router();

r.get('/audit', async (req, res) => {
  const userRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  if (userRow.rows.length === 0) return res.status(403).json({ error: 'Not provisioned' });
  const userId = userRow.rows[0].id;

  let vendor = await db.query(
    `SELECT id, audit_answers, match_criteria, status FROM vendor_records WHERE user_id = $1`,
    [userId],
  );
  if (vendor.rows.length === 0) {
    const ins = await db.query(
      `INSERT INTO vendor_records (user_id, status) VALUES ($1, 'pending') RETURNING id, audit_answers, match_criteria, status`,
      [userId],
    );
    vendor = ins;
  }

  const questions = await db.query(
    `SELECT id, section, order_index, text, help_text, type, options, required, dimension
     FROM questions
     WHERE active = TRUE AND audience = 'vendor'
     ORDER BY section, order_index`,
  );

  res.json({ vendor: vendor.rows[0], questions: questions.rows });
});

r.post('/audit/answer', async (req, res) => {
  const userRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  if (userRow.rows.length === 0) return res.status(403).json({ error: 'Not provisioned' });
  const userId = userRow.rows[0].id;

  const { question_id, value } = req.body ?? {};
  if (!question_id) return res.status(400).json({ error: 'question_id required' });

  await db.query(
    `UPDATE vendor_records
     SET audit_answers = jsonb_set(audit_answers, ARRAY[$2::text], to_jsonb($3::jsonb), true)
     WHERE user_id = $1`,
    [userId, question_id, JSON.stringify(value)],
  );
  res.json({ ok: true });
});

r.post('/audit/criteria', async (req, res) => {
  const userRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  const userId = userRow.rows[0].id;

  const { modes, erp_compat, personas_served, capabilities, dimension_scores } = req.body ?? {};

  const payload = {
    modes: Array.isArray(modes) ? modes : [],
    erp_compat: Array.isArray(erp_compat) ? erp_compat : [],
    personas_served: Array.isArray(personas_served) ? personas_served : [],
    capabilities: typeof capabilities === 'object' && capabilities ? capabilities : {},
    dimension_scores: sanitizeDimScores(dimension_scores),
  };

  await db.query(
    `UPDATE vendor_records SET match_criteria = $2 WHERE user_id = $1`,
    [userId, payload],
  );
  res.json({ ok: true });
});

r.post('/audit/submit', async (req, res) => {
  const userRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  const userId = userRow.rows[0].id;

  const vr = await db.query(
    `UPDATE vendor_records
     SET status = 'under_review', audit_submitted_at = NOW()
     WHERE user_id = $1 AND status = 'pending'
     RETURNING id`,
    [userId],
  );
  if (vr.rows.length === 0) {
    return res.status(400).json({ error: 'Audit already submitted or record not found' });
  }

  await db.query(
    `INSERT INTO notifications (recipient_id, type, payload)
     SELECT id, 'vendor_submitted', jsonb_build_object('vendor_id', $1)
     FROM users WHERE role = 'admin'`,
    [vr.rows[0].id],
  );

  res.json({ ok: true, status: 'under_review' });
});

r.post('/answer-change', async (req, res) => {
  const userRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  const { session_id, section, new_answers, reason } = req.body ?? {};

  const old = await db.query(
    `SELECT audit_answers FROM vendor_records WHERE id = $1 AND user_id = $2`,
    [session_id, userRow.rows[0].id],
  );
  if (old.rows.length === 0) return res.status(404).json({ error: 'Vendor record not found' });

  await db.query(
    `INSERT INTO answer_change_requests (user_id, session_type, session_id, section, old_answers, new_answers, reason)
     VALUES ($1, 'vendor', $2, $3, $4, $5, $6)`,
    [userRow.rows[0].id, session_id, section, old.rows[0].audit_answers, new_answers, reason],
  );

  await db.query(
    `INSERT INTO notifications (recipient_id, type, payload)
     SELECT id, 'vendor_answer_update', jsonb_build_object('vendor_id', $1)
     FROM users WHERE role = 'admin'`,
    [session_id],
  );

  res.json({ ok: true });
});

const DIMS = ['D1','D2','D3','D4','D5','D6','D7','D8','D9'] as const;
function sanitizeDimScores(input: any): Record<(typeof DIMS)[number], number> {
  const out: any = {};
  for (const d of DIMS) {
    const v = Number(input?.[d]);
    out[d] = Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
  }
  return out;
}

export default r;
