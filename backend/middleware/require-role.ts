import { Request, Response, NextFunction } from 'express';
import { db } from '../db';

export function requireRole(role: 'admin' | 'client' | 'vendor') {
  return async (req: Request, res: Response, next: NextFunction) => {
    console.log('[requireRole] HIT - timestamp:', Date.now(), 'role:', role, 'path:', req.path);

    const clerkUserId = (req as any).auth?.userId; 

    console.log('[requireRole] role required:', role);
    console.log('[requireRole] clerkUserId from auth:', clerkUserId);

    if (!clerkUserId) {
      console.log('[requireRole] FAIL: no clerkUserId');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { rows } = await db.query(
      'SELECT role, two_factor_enabled FROM users WHERE clerk_user_id = $1',
      [clerkUserId],
    );

    console.log('[requireRole] db query returned rows:', rows.length);

    if (rows.length === 0) {
      console.log('[requireRole] FAIL: user not provisioned, clerk_user_id was:', clerkUserId);
      return res.status(403).json({ error: 'Not provisioned' });
    }

    const user = rows[0];
    console.log('[requireRole] db user role:', user.role);

    if (user.role !== role) {
      console.log('[requireRole] FAIL: role mismatch. db has', user.role, 'but route needs', role);
      return res.status(403).json({ error: 'Forbidden' });
    }

    // TEMP: 2FA check disabled for setup. Re-enable before going to production.
    // if (role === 'admin' && !user.two_factor_enabled) {
    //   return res.status(403).json({ error: '2FA required for admin access' });
    // }

    (req as any).appUser = user;
    console.log('[requireRole] PASS');
    next();
  };
}
