import { Router } from 'express';
import { db } from '../../db';

const r = Router();

r.get('/scoring-config', async (_req, res) => {
  const { rows } = await db.query(
    `SELECT dimension, label, weight, persona_boosts, updated_at FROM scoring_config ORDER BY dimension`,
  );
  res.json({ dimensions: rows });
});

r.patch('/scoring-config', async (req, res) => {
  const { updates } = req.body ?? {};
  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'updates[] required' });
  }

  const adminRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  const adminId = adminRow.rows[0].id;

  const before = await db.query(`SELECT dimension, weight, persona_boosts FROM scoring_config ORDER BY dimension`);

  const client = await (db as any).connect();
  try {
    await client.query('BEGIN');
    await client.query('SET CONSTRAINTS trg_scoring_sum DEFERRED');

    for (const u of updates) {
      if (typeof u.dimension !== 'string') continue;
      const weight = Number(u.weight);
      const boosts = typeof u.persona_boosts === 'object' && u.persona_boosts ? u.persona_boosts : {};
      await client.query(
        `UPDATE scoring_config SET weight = $1, persona_boosts = $2, updated_at = NOW(), updated_by = $3 WHERE dimension = $4`,
        [weight, boosts, adminId, u.dimension],
      );
    }

    await client.query('COMMIT');
  } catch (err: any) {
    await client.query('ROLLBACK');
    return res.status(400).json({ error: err.message ?? 'Update failed' });
  } finally {
    client.release();
  }

  const after = await db.query(`SELECT dimension, weight, persona_boosts FROM scoring_config ORDER BY dimension`);

  await db.query(
    `INSERT INTO audit_log (user_id, action, entity_type, entity_id, before, after)
     VALUES ($1, 'scoring_config_update', 'scoring_config', NULL, $2, $3)`,
    [adminId, JSON.stringify(before.rows), JSON.stringify(after.rows)],
  );

  res.json({ dimensions: after.rows });
});

export default r;
