import { SENDERS, NOTIFICATION_BCC, sgMail } from './mail';
import { db } from '../db';

type NotifType =
  | 'client_submitted' | 'vendor_submitted'
  | 'vendor_accepted_lead' | 'vendor_declined_lead'
  | 'client_answer_update' | 'vendor_answer_update'
  | 'match_created' | 'intro_sent';

const SUBJECT: Record<NotifType, string> = {
  client_submitted:       'New client assessment submitted',
  vendor_submitted:       'New vendor audit submitted',
  vendor_accepted_lead:   'Vendor accepted a lead',
  vendor_declined_lead:   'Vendor declined a lead',
  client_answer_update:   'Client requested an answer update',
  vendor_answer_update:   'Vendor requested an answer update',
  match_created:          'Match results generated',
  intro_sent:             'Warm intro sent',
};

export async function drainNotificationsToEmail() {
  const { rows } = await db.query(
    `SELECT n.id, n.recipient_id, n.type, n.payload, u.email
     FROM notifications n JOIN users u ON u.id = n.recipient_id
     WHERE n.email_sent = FALSE
     ORDER BY n.created_at ASC LIMIT 50`,
  );

  for (const n of rows) {
    try {
      await sgMail.send({
        from: SENDERS.SYSTEM,
        to: n.email,
        bcc: [...NOTIFICATION_BCC],
        subject: SUBJECT[n.type as NotifType] ?? 'PreShiftIQ notification',
        text: buildEmailBody(n.type, n.payload),
      });
      await db.query(`UPDATE notifications SET email_sent = TRUE WHERE id = $1`, [n.id]);
    } catch (err) {
      console.error(`Failed to send notification ${n.id}`, err);
    }
  }
}

function buildEmailBody(type: string, payload: any): string {
  const link = (p: string) => `https://app.preshiftiq.com${p}`;
  switch (type) {
    case 'client_submitted':    return `A new client assessment has been submitted and matched.\n\nReview: ${link(`/admin/clients?session=${payload.session_id}`)}\nMatches generated: ${payload.match_count}`;
    case 'vendor_submitted':    return `A new vendor audit has been submitted.\n\nReview: ${link(`/admin/vendors`)}`;
    case 'vendor_accepted_lead':return `A vendor accepted a lead and has paid the $250 lead fee.\n\nSend warm intro: ${link(`/admin/matches?status=accepted`)}`;
    case 'vendor_declined_lead':return `A vendor declined a lead.\n\nMatch: ${link(`/admin/matches`)}`;
    case 'client_answer_update':
    case 'vendor_answer_update':return `An answer update has been requested.\n\nReview: ${link(`/admin/change-requests`)}`;
    case 'match_created':       return `Matches generated for session ${payload.session_id}. ${payload.status === 'held' ? `HELD: only ${payload.qualifying_count} qualifying vendors - manual review required.` : `${payload.count} vendors notified.`}`;
    case 'intro_sent':          return `Warm intro sent for match ${payload.match_id}.`;
    default: return JSON.stringify(payload);
  }
}
