import { Router } from 'express';
import { db } from '../../db';
import { PERSONAS } from '../../lib/personas';
import assessmentRoutes from './assessment';
import matchesRoutes from './matches';

const VALID_PERSONAS = new Set<string>(PERSONAS.map(p => p.id));
const r = Router();

r.post('/session', async (req, res) => {
  const userRow = await db.query('SELECT id FROM users WHERE clerk_user_id = $1', [(req as any).auth.userId]);
  if (userRow.rows.length === 0) return res.status(403).json({ error: 'Not provisioned' });
  const userId = userRow.rows[0].id;

  const personas: string[] = Array.isArray(req.body?.persona_tags) ? req.body.persona_tags : [];
  const cleaned = personas.filter(p => VALID_PERSONAS.has(p));
  if (cleaned.length === 0) return res.status(400).json({ error: 'At least one persona required' });

  const existing = await db.query(
    `SELECT id FROM client_sessions WHERE user_id = $1 AND status IN ('draft','in_progress') ORDER BY created_at DESC LIMIT 1`,
    [userId],
  );
  if (existing.rows[0]) {
    await db.query(`UPDATE client_sessions SET persona_tags = $1, status = 'in_progress' WHERE id = $2`, [cleaned, existing.rows[0].id]);
    return res.json({ session_id: existing.rows[0].id });
  }
  const inserted = await db.query(
    `INSERT INTO client_sessions (user_id, persona_tags, status) VALUES ($1, $2, 'in_progress') RETURNING id`,
    [userId, cleaned],
  );
  res.json({ session_id: inserted.rows[0].id });
});

r.use(assessmentRoutes);
r.use(matchesRoutes);
export default r;
