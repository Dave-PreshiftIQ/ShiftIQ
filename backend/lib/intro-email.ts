import { SENDERS, sgMail } from './mail';
import { db } from '../db';

export async function buildIntroDraft(matchId: string) {
  const { rows } = await db.query(
    `SELECT
       cu.name AS client_name, cu.email AS client_email, cu.company AS client_company,
       vu.name AS vendor_name, vu.email AS vendor_email, vu.company AS vendor_company,
       m.total_score, m.tier
     FROM match_results m
     JOIN client_sessions cs ON cs.id = m.client_session_id
     JOIN vendor_records  vr ON vr.id = m.vendor_id
     JOIN users cu ON cu.id = cs.user_id
     JOIN users vu ON vu.id = vr.user_id
     WHERE m.id = $1`,
    [matchId],
  );
  if (rows.length === 0) throw new Error('Match not found');
  const r = rows[0];

  const subject = `Introduction: ${r.client_company} and ${r.vendor_company} - PreShiftIQ match`;

  const body =
`Hi ${r.client_name.split(' ')[0]} and ${r.vendor_name.split(' ')[0]},

I'm glad to introduce the two of you. Based on PreShiftIQ's fiduciary match (score ${Number(r.total_score).toFixed(0)}, ${r.tier.replace('_',' ')}), I believe this is a conversation worth having.

${r.client_name} / ${r.client_company} - meet ${r.vendor_name} / ${r.vendor_company}.
${r.vendor_name} / ${r.vendor_company} - meet ${r.client_name} / ${r.client_company}.

A few notes:
  - This is a vetted match, not a referral fee arrangement on the buyer side. ${r.client_company} has paid nothing and has no obligation.
  - ${r.vendor_company} has completed PreShiftIQ's vendor audit.
  - I'll step out of this thread and let you take it from here.

Whenever you're ready - reply-all, and you're off.

Best,
Dave Pattelli
PreShiftIQ - dave@preshiftiq.com
`;

  return { to: [r.client_email, r.vendor_email], cc: ['dave@preshiftiq.com'], subject, body };
}

export async function sendIntro(matchId: string, overrides?: { subject?: string; body?: string }) {
  const draft = await buildIntroDraft(matchId);
  const subject = overrides?.subject ?? draft.subject;
  const body    = overrides?.body    ?? draft.body;

  await sgMail.send({
    from: SENDERS.DAVE,
    to: draft.to,
    cc: draft.cc,
    subject,
    text: body,
    trackingSettings: { clickTracking: { enable: false }, openTracking: { enable: false } },
  });

  await db.query(`UPDATE match_results SET intro_sent_at = NOW() WHERE id = $1`, [matchId]);
  await db.query(
    `INSERT INTO notifications (recipient_id, type, payload)
     SELECT id, 'intro_sent', jsonb_build_object('match_id', $1) FROM users WHERE role = 'admin'`,
    [matchId],
  );
}
