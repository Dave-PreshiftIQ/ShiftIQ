import { Router } from 'express';
import { db } from '../../db';

const r = Router();

r.patch('/vendors/:id/status', async (req, res) => {
  const { status } = req.body ?? {};
  if (!['pending','under_review','active','inactive'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const adminRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  const adminId = adminRow.rows[0].id;

  const before = await db.query(`SELECT status FROM vendor_records WHERE id = $1`, [req.params.id]);
  if (before.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });

  const setActivated   = status === 'active'   ? ', activated_at = NOW()'   : '';
  const setDeactivated = status === 'inactive' ? ', deactivated_at = NOW()' : '';

  await db.query(
    `UPDATE vendor_records SET status = $1 ${setActivated} ${setDeactivated} WHERE id = $2`,
    [status, req.params.id],
  );

  await db.query(
    `INSERT INTO audit_log (user_id, action, entity_type, entity_id, before, after)
     VALUES ($1, 'vendor_status_change', 'vendor_record', $2, $3, $4)`,
    [adminId, req.params.id, { status: before.rows[0].status }, { status }],
  );

  res.json({ ok: true });
});

export default r;
