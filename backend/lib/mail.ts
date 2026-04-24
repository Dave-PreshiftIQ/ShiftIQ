import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const SENDERS = {
  SYSTEM: { email: 'system@preshiftiq.com', name: 'PreShiftIQ' },
  DAVE:   { email: 'dave@preshiftiq.com',   name: 'Dave Pattelli - PreShiftIQ' },
} as const;

export const NOTIFICATION_BCC = ['info@preshiftiq.com'] as const;
export const PUBLIC_CONTACT_EMAIL = 'info@preshiftiq.com';

export { sgMail };
