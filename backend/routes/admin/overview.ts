import { Router } from 'express';
import { db } from '../../db';

const r = Router();

r.get('/overview', async (_req, res) => {
  const q = `
    SELECT
      (SELECT COUNT(*)::int FROM users WHERE role = 'client') AS active_clients,
      (SELECT COUNT(*)::int FROM vendor_records WHERE status = 'active') AS active_vendors,
      (SELECT COUNT(*)::int FROM match_results WHERE vendor_notified_at IS NOT NULL AND vendor_accepted = FALSE AND vendor_declined = FALSE) AS pending_leads,
      (SELECT COUNT(*)::int FROM match_results WHERE vendor_accepted = TRUE) AS accepted_leads,
      (SELECT COUNT(*)::int FROM vendor_records WHERE status = 'under_review') AS pending_vendor_applications,
      (SELECT COUNT(*)::int FROM answer_change_requests WHERE status = 'pending') AS pending_answer_updates,
      (SELECT COUNT(*)::int FROM client_sessions WHERE answers #>> '{_meta,match_hold}' = 'true' AND status = 'matched') AS held_sessions
  `;
  const { rows } = await db.query(q);
  res.json(rows[0]);
});

export default r;
