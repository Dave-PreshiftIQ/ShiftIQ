import { Router } from 'express';
import { db } from '../../db';
import { fetchVendorContactIfAllowed } from '../../lib/data-release-policy';

const r = Router();

r.get('/matches', async (req, res) => {
  const userRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  if (userRow.rows.length === 0) return res.json({ matches: [], held: false });
  const userId = userRow.rows[0].id;

  const latest = await db.query(
    `SELECT id, answers FROM client_sessions
     WHERE user_id = $1 AND status IN ('matched','submitted')
     ORDER BY submitted_at DESC NULLS LAST, created_at DESC LIMIT 1`,
    [userId],
  );
  if (latest.rows.length === 0) return res.json({ matches: [], held: false });

  const held = latest.rows[0].answers?._meta?.match_hold === true;
  if (held) {
    return res.json({
      matches: [],
      held: true,
      hold_message: 'Your profile is under manual review. Dave will be in touch within one business day.',
    });
  }

  const matches = await db.query(
    `SELECT id, vendor_id, total_score, tier, vendor_accepted, vendor_notified_at
     FROM match_results
     WHERE client_session_id = $1 AND phase1_pass = TRUE AND tier <> 'not_recommended'
           AND vendor_notified_at IS NOT NULL
     ORDER BY total_score DESC`,
    [latest.rows[0].id],
  );

  res.json({
    held: false,
    matches: matches.rows.map((m, i) => ({
      id: m.id,
      masked_id: String.fromCharCode(65 + i),
      total_score: Number(m.total_score),
      tier: m.tier,
      accepted: m.vendor_accepted,
    })),
  });
});

r.get('/matches/:id/vendor-contact', async (req, res) => {
  const userRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  const contact = await fetchVendorContactIfAllowed(req.params.id, userRow.rows[0].id);
  if (!contact) return res.status(403).json({ error: 'Not released' });
  res.json({ vendor: contact });
});

export default r;
