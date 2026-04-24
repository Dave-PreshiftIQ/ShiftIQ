import { Router } from 'express';
import { db } from '../db';

const r = Router();

r.get('/notifications', async (req, res) => {
  const userRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  if (userRow.rows.length === 0) return res.json({ items: [] });
  const { rows } = await db.query(
    `SELECT id, type, payload, read, created_at FROM notifications
     WHERE recipient_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userRow.rows[0].id],
  );
  res.json({ items: rows });
});

r.post('/notifications/:id/read', async (req, res) => {
  const userRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  if (userRow.rows.length === 0) return res.status(403).json({ error: 'Not provisioned' });
  await db.query(
    `UPDATE notifications SET read = TRUE WHERE id = $1 AND recipient_id = $2`,
    [req.params.id, userRow.rows[0].id],
  );
  res.json({ ok: true });
});

export default r;
