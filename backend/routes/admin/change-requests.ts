import { Router } from 'express';
import { db } from '../../db';
import { getBoss, QUEUE_MATCHING } from '../../lib/jobs';

const r = Router();

r.get('/change-requests', async (req, res) => {
  const { status = 'pending' } = req.query;
  const { rows } = await db.query(
    `SELECT cr.*, u.name AS requester_name, u.email AS requester_email, u.role AS requester_role
     FROM answer_change_requests cr JOIN users u ON u.id = cr.user_id
     WHERE cr.status = $1 ORDER BY cr.created_at DESC`,
    [status],
  );
  res.json({ requests: rows });
});

r.post('/change-requests/:id/approve', async (req, res) => {
  const adminRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  const adminId = adminRow.rows[0].id;
  const { note } = req.body ?? {};

  const cr = await db.query(
    `SELECT * FROM answer_change_requests WHERE id = $1 AND status = 'pending'`,
    [req.params.id],
  );
  if (cr.rows.length === 0) return res.status(404).json({ error: 'Pending request not found' });
  const request = cr.rows[0];

  if (request.session_type === 'client') {
    await db.query(
      `UPDATE client_sessions
       SET answers = answers || $1::jsonb,
           status = 'submitted'
       WHERE id = $2`,
      [request.new_answers, request.session_id],
    );
    const boss = await getBoss();
    await boss.send(QUEUE_MATCHING, { session_id: request.session_id });
  } else if (request.session_type === 'vendor') {
    await db.query(
      `UPDATE vendor_records SET audit_answers = audit_answers || $1::jsonb WHERE id = $2`,
      [request.new_answers, request.session_id],
    );
  }

  await db.query(
    `UPDATE answer_change_requests
     SET status = 'approved', reviewed_at = NOW(), reviewer_id = $1, reviewer_note = $2
     WHERE id = $3`,
    [adminId, note ?? null, req.params.id],
  );

  await db.query(
    `INSERT INTO audit_log (user_id, action, entity_type, entity_id, before, after)
     VALUES ($1, 'change_request_approve', 'answer_change_request', $2, $3, $4)`,
    [adminId, req.params.id, request.old_answers, request.new_answers],
  );

  res.json({ ok: true });
});

r.post('/change-requests/:id/reject', async (req, res) => {
  const adminRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  const { note } = req.body ?? {};

  const upd = await db.query(
    `UPDATE answer_change_requests
     SET status = 'rejected', reviewed_at = NOW(), reviewer_id = $1, reviewer_note = $2
     WHERE id = $3 AND status = 'pending' RETURNING id`,
    [adminRow.rows[0].id, note ?? null, req.params.id],
  );
  if (upd.rows.length === 0) return res.status(404).json({ error: 'Pending request not found' });

  await db.query(
    `INSERT INTO audit_log (user_id, action, entity_type, entity_id, before, after)
     VALUES ($1, 'change_request_reject', 'answer_change_request', $2, NULL, $3)`,
    [adminRow.rows[0].id, req.params.id, { note }],
  );

  res.json({ ok: true });
});

export default r;
