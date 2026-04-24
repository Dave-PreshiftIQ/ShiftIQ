import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { BLOCKED_DOMAINS } from '../lib/business-email';

export async function requireBusinessEmail(req: Request, res: Response, next: NextFunction) {
  const clerkUserId = (req as any).auth?.userId;
  if (!clerkUserId) return res.status(401).json({ error: 'Unauthorized' });

  const { rows } = await db.query(
    'SELECT email_verified, email_domain FROM users WHERE clerk_user_id = $1',
    [clerkUserId],
  );
  if (rows.length === 0) return res.status(403).json({ error: 'User not provisioned' });

  const { email_verified, email_domain } = rows[0];
  if (!email_verified) {
    return res.status(403).json({ error: 'Email not verified' });
  }

  if (BLOCKED_DOMAINS.has(email_domain)) {
    return res.status(403).json({ error: 'Business email required' });
  }

  next();
}
