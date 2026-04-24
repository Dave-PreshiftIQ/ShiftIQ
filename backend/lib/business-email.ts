import dns from 'dns/promises';

export const BLOCKED_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'ymail.com', 'rocketmail.com',
  'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
  'aol.com',
  'icloud.com', 'me.com', 'mac.com',
  'proton.me', 'protonmail.com',
  'mail.com', 'gmx.com', 'gmx.net',
  'zoho.com',
  'yandex.com', 'yandex.ru',
  'tutanota.com',
  'mailinator.com', 'guerrillamail.com', '10minutemail.com',
  'tempmail.com', 'throwaway.email', 'trashmail.com',
]);

export type EmailGateResult =
  | { ok: true;  domain: string }
  | { ok: false; reason: 'invalid_format' | 'personal_domain' | 'no_mx_records' | 'disposable' };

export async function validateBusinessEmail(email: string): Promise<EmailGateResult> {
  const match = email.trim().toLowerCase().match(/^[^\s@]+@([^\s@]+\.[^\s@]+)$/);
  if (!match) return { ok: false, reason: 'invalid_format' };

  const domain = match[1];

  if (BLOCKED_DOMAINS.has(domain)) {
    return { ok: false, reason: 'personal_domain' };
  }

  try {
    const mx = await dns.resolveMx(domain);
    if (!mx || mx.length === 0) return { ok: false, reason: 'no_mx_records' };
  } catch {
    return { ok: false, reason: 'no_mx_records' };
  }

  return { ok: true, domain };
}

export function businessEmailErrorMessage(reason: Exclude<EmailGateResult, { ok: true }>['reason']): string {
  switch (reason) {
    case 'invalid_format':    return 'Please enter a valid email address.';
    case 'personal_domain':   return 'Please use your business email address. Personal email providers (Gmail, Yahoo, Hotmail, etc.) are not accepted.';
    case 'no_mx_records':     return 'We could not verify your email domain. Please check the address and try again.';
    case 'disposable':        return 'Disposable email addresses are not accepted. Please use your business email.';
  }
}
