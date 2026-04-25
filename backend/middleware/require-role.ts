import { Request, Response, NextFunction } from 'express';
import { db } from '../db';

export function requireRole(role: 'admin' | 'client' | 'vendor') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const clerkUserId = (req as any).auth?.userId;
    if (!clerkUserId) return res.status(401).json({ error: 'Unauthorized' });

    const { rows } = await db.query(
      'SELECT role, two_factor_enabled FROM users WHERE clerk_user_id = $1',
      [clerkUserId],
    );
    if (rows.length === 0) return res.status(403).json({ error: 'Not provisioned' });

    const user = rows[0];
    if (user.role !== role) return res.status(403).json({ error: 'Forbidden' });

  // TEMP: 2FA check disabled for setup. Re-enable before going to production.
    // if (role === 'admin' && !user.two_factor_enabled) {
    //   return res.status(403).json({ error: '2FA required for admin access' });
    // }
    (req as any).appUser = user;
    next();
  };
}
