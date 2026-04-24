import { Router } from 'express';
import Stripe from 'stripe';
import { db } from '../../db';
import { fetchClientContactIfAllowed } from '../../lib/data-release-policy';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });
const LEAD_FEE_CENTS = 25000;

const r = Router();

r.get('/leads', async (req, res) => {
  const userRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  if (userRow.rows.length === 0) return res.status(403).json({ error: 'Not provisioned' });
  const vendor = await db.query(`SELECT id FROM vendor_records WHERE user_id = $1`, [userRow.rows[0].id]);
  if (vendor.rows.length === 0) return res.status(404).json({ error: 'Vendor record not found' });

  const leads = await db.query(
    `SELECT match_id, total_score, tier, score_breakdown, persona_tags,
            freight_spend_range, modes, current_systems, watch_points,
            vendor_accepted, accepted_at, vendor_notified_at
     FROM vendor_lead_card_view
     WHERE vendor_id = $1 AND vendor_notified_at IS NOT NULL
     ORDER BY vendor_notified_at DESC`,
    [vendor.rows[0].id],
  );

  res.json({ leads: leads.rows });
});

r.post('/leads/:id/accept', async (req, res) => {
  const { terms_accepted, payment_method_id } = req.body ?? {};
  if (!terms_accepted) return res.status(400).json({ error: 'Terms must be accepted' });
  if (!payment_method_id) return res.status(400).json({ error: 'Payment method required' });

  const userRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  if (userRow.rows.length === 0) return res.status(403).json({ error: 'Not provisioned' });
  const vendorRow = await db.query(`SELECT id FROM vendor_records WHERE user_id = $1`, [userRow.rows[0].id]);
  if (vendorRow.rows.length === 0) return res.status(404).json({ error: 'Vendor record not found' });

  const match = await db.query(
    `SELECT id, client_session_id, vendor_accepted, vendor_declined
     FROM match_results WHERE id = $1 AND vendor_id = $2`,
    [req.params.id, vendorRow.rows[0].id],
  );
  if (match.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
  if (match.rows[0].vendor_accepted)  return res.status(409).json({ error: 'Already accepted' });
  if (match.rows[0].vendor_declined)  return res.status(409).json({ error: 'Already declined' });

  let paymentIntentId: string;
  try {
    const intent = await stripe.paymentIntents.create({
      amount: LEAD_FEE_CENTS,
      currency: 'usd',
      payment_method: payment_method_id,
      confirm: true,
      off_session: false,
      description: `PreShiftIQ Lead Fee - match ${match.rows[0].id}`,
      metadata: { match_id: match.rows[0].id, vendor_id: vendorRow.rows[0].id },
    });
    if (intent.status !== 'succeeded') {
      return res.status(402).json({ error: `Payment status: ${intent.status}` });
    }
    paymentIntentId = intent.id;
  } catch (err: any) {
    return res.status(402).json({ error: err?.message ?? 'Payment failed' });
  }

  try {
    await db.query(
      `UPDATE match_results
       SET vendor_accepted = TRUE, accepted_at = NOW(), stripe_charge_id = $1
       WHERE id = $2`,
      [paymentIntentId, match.rows[0].id],
    );
  } catch (err) {
    try { await stripe.refunds.create({ payment_intent: paymentIntentId }); } catch {}
    return res.status(500).json({ error: 'Acceptance failed, payment refunded' });
  }

  await db.query(
    `INSERT INTO notifications (recipient_id, type, payload)
     SELECT id, 'vendor_accepted_lead', jsonb_build_object('match_id', $1, 'vendor_id', $2)
     FROM users WHERE role = 'admin'`,
    [match.rows[0].id, vendorRow.rows[0].id],
  );

  const client = await fetchClientContactIfAllowed(match.rows[0].id, userRow.rows[0].id);
  if (!client) {
    try { await stripe.refunds.create({ payment_intent: paymentIntentId }); } catch {}
    return res.status(500).json({ error: 'Release policy denied post-charge - payment refunded' });
  }

  res.json({
    accepted: true,
    stripe_charge_id: paymentIntentId,
    client,
    note: 'Dave will send a warm introduction shortly.',
  });
});

r.post('/leads/:id/decline', async (req, res) => {
  const userRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  const vendorRow = await db.query(`SELECT id FROM vendor_records WHERE user_id = $1`, [userRow.rows[0].id]);

  const upd = await db.query(
    `UPDATE match_results SET vendor_declined = TRUE, declined_at = NOW()
     WHERE id = $1 AND vendor_id = $2 AND vendor_accepted = FALSE
     RETURNING id`,
    [req.params.id, vendorRow.rows[0].id],
  );
  if (upd.rows.length === 0) return res.status(404).json({ error: 'Lead not found or already acted on' });

  await db.query(
    `INSERT INTO notifications (recipient_id, type, payload)
     SELECT id, 'vendor_declined_lead', jsonb_build_object('match_id', $1)
     FROM users WHERE role = 'admin'`,
    [req.params.id],
  );
  res.json({ declined: true });
});

r.get('/leads/:id/client-contact', async (req, res) => {
  const userRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  const contact = await fetchClientContactIfAllowed(req.params.id, userRow.rows[0].id);
  if (!contact) return res.status(403).json({ error: 'Not released' });
  res.json({ client: contact });
});

export default r;
