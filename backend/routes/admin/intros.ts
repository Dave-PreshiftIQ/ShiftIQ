import { Router } from 'express';
import { buildIntroDraft, sendIntro } from '../../lib/intro-email';
import { decideRelease } from '../../lib/data-release-policy';
import { db } from '../../db';

const r = Router();

r.get('/intros/:matchId/draft', async (req, res) => {
  const decision = await decideRelease(req.params.matchId);
  if (decision.state !== 'vendor_accepted') {
    return res.status(403).json({ error: `Cannot draft intro - release state is ${decision.state}` });
  }
  const draft = await buildIntroDraft(req.params.matchId);
  res.json({ draft });
});

r.post('/intros/:matchId/send', async (req, res) => {
  const decision = await decideRelease(req.params.matchId);
  if (decision.state !== 'vendor_accepted') {
    return res.status(403).json({ error: `Cannot send intro - release state is ${decision.state}` });
  }

  const { subject, body } = req.body ?? {};

  const adminRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  await sendIntro(req.params.matchId, { subject, body });

  await db.query(
    `INSERT INTO audit_log (user_id, action, entity_type, entity_id, before, after)
     VALUES ($1, 'warm_intro_sent', 'match_result', $2, NULL, $3)`,
    [adminRow.rows[0].id, req.params.matchId, { subject_used: subject ?? 'default', body_edited: !!body }],
  );

  res.json({ ok: true });
});

export default r;
