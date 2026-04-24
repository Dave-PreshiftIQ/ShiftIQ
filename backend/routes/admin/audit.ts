import { Router } from 'express';
import { db } from '../../db';

const r = Router();

r.get('/audit-log', async (req, res) => {
  const { action, entity_type, limit = 100 } = req.query;
  const params: any[] = [];
  const clauses: string[] = [];
  if (action)      { params.push(action); clauses.push(`action = $${params.length}`); }
  if (entity_type) { params.push(entity_type); clauses.push(`entity_type = $${params.length}`); }
  params.push(Number(limit));

  const { rows } = await db.query(
    `SELECT a.*, u.name AS actor_name, u.email AS actor_email, u.role AS actor_role
     FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
     ${clauses.length ? 'WHERE ' + clauses.join(' AND ') : ''}
     ORDER BY timestamp DESC LIMIT $${params.length}`,
    params,
  );
  res.json({ entries: rows });
});

export default r;
