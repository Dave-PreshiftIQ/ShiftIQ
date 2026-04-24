import express from 'express';
import { Webhook } from 'svix';
import { db } from '../../db';

const router = express.Router();

router.post('/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  const svix_id        = req.header('svix-id');
  const svix_timestamp = req.header('svix-timestamp');
  const svix_signature = req.header('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).send('Missing Svix headers');
  }

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  let evt: any;
  try {
    evt = wh.verify(req.body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch {
    return res.status(400).send('Invalid signature');
  }

  const { type, data } = evt;

  if (type === 'user.created' || type === 'user.updated') {
    const email       = data.email_addresses?.[0]?.email_address;
    const emailDomain = email?.split('@')[1]?.toLowerCase() ?? '';
    const role        = data.public_metadata?.role ?? data.unsafe_metadata?.role ?? 'client';
    const name        = `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim();
    const phone       = data.phone_numbers?.[0]?.phone_number ?? data.unsafe_metadata?.phone ?? '';
    const company     = data.public_metadata?.company ?? data.unsafe_metadata?.company ?? '';

    await db.query(
      `INSERT INTO users (clerk_user_id, name, email, phone, company, role, email_verified, email_domain, two_factor_enabled)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (clerk_user_id) DO UPDATE SET
         name                = EXCLUDED.name,
         email               = EXCLUDED.email,
         phone               = EXCLUDED.phone,
         company             = EXCLUDED.company,
         email_verified      = EXCLUDED.email_verified,
         email_domain        = EXCLUDED.email_domain,
         two_factor_enabled  = EXCLUDED.two_factor_enabled`,
      [
        data.id, name || 'Unknown', email, phone, company, role,
        data.email_addresses?.[0]?.verification?.status === 'verified',
        emailDomain,
        data.two_factor_enabled ?? false,
      ],
    );
  }

  res.status(200).send('OK');
});

export default router;
