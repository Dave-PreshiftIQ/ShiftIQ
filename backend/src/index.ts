import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { clerkMiddleware, requireAuth } from '@clerk/express';

import { requireBusinessEmail } from '../middleware/require-business-email';
import { requireRole } from '../middleware/require-role';

import publicRoutes   from '../routes/public';
import webhookRoutes  from '../routes/webhooks/clerk';
import meRoutes       from '../routes/me';
import clientRoutes   from '../routes/client';
import vendorRoutes   from '../routes/vendor';
import adminRoutes    from '../routes/admin';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [
        'https://app.preshiftiq.com',
        'https://shift-iq-frontend.vercel.app',
        /^https:\/\/shift-iq-frontend-.*\.vercel\.app$/,
      ]
    : ['http://localhost:3000'],
  credentials: true,
}));

// Webhooks need raw body - mount BEFORE json parser
app.use('/webhooks', webhookRoutes);

app.use(express.json({ limit: '1mb' }));
app.use(clerkMiddleware());

app.use('/api/public', publicRoutes);
app.use('/api/me',     requireAuth(), meRoutes);
app.use('/api/client', requireAuth(), requireRole('client'), requireBusinessEmail, clientRoutes);
app.use('/api/vendor', requireAuth(), requireRole('vendor'), requireBusinessEmail, vendorRoutes);
app.use('/api/admin',  requireAuth(), requireRole('admin'), adminRoutes);
app.get('/health', (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`API listening on :${port}`));
