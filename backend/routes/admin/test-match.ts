import { Router } from 'express';
import { db } from '../../db';
import { testMatch } from '../../lib/matching';

const r = Router();

r.get('/test-match/sessions', async (_req, res) => {
  const { rows } = await db.query(
    `SELECT cs.id, cs.persona_tags, cs.status, cs.submitted_at, cs.created_at, u.company, u.name
     FROM client_sessions cs JOIN users u ON u.id = cs.user_id
     ORDER BY cs.created_at DESC LIMIT 100`,
  );
  res.json({ sessions: rows });
});

r.post('/test-match/:sessionId', async (req, res) => {
  const adminRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  const result = await testMatch(req.params.sessionId);

  const ids = result.all_results.map(r => r.vendor_id);
  const vendors = ids.length === 0 ? { rows: [] } : await db.query(
    `SELECT vr.id, u.company FROM vendor_records vr JOIN users u ON u.id = vr.user_id WHERE vr.id = ANY($1::uuid[])`,
    [ids],
  );
  const nameOf = new Map(vendors.rows.map((v: any) => [v.id, v.company]));

  await db.query(
    `INSERT INTO audit_log (user_id, action, entity_type, entity_id, before, after)
     VALUES ($1, 'test_match_run', 'client_session', $2, NULL, $3)`,
    [adminRow.rows[0].id, req.params.sessionId, { qualified_count: result.qualified_count, would_hold: result.would_hold }],
  );

  res.json({
    ...result,
    all_results: result.all_results.map(r => ({ ...r, vendor_name: nameOf.get(r.vendor_id) ?? 'Unknown' })),
  });
});

export default r;
