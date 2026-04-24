import { Router } from 'express';
import { validateBusinessEmail, businessEmailErrorMessage } from '../../lib/business-email';

const router = Router();

router.post('/validate-email', async (req, res) => {
  const { email } = req.body ?? {};
  if (typeof email !== 'string') return res.status(400).json({ ok: false, message: 'Email required' });

  const result = await validateBusinessEmail(email);
  if (!result.ok) {
    return res.json({ ok: false, message: businessEmailErrorMessage(result.reason) });
  }
  res.json({ ok: true });
});

export default router;
