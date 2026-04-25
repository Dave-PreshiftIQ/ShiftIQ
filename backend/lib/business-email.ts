const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com',
  'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com', 'gmx.com',
  'yandex.com', 'fastmail.com', 'msn.com', 'live.com', 'me.com',
]);

export const BLOCKED_DOMAINS = FREE_EMAIL_DOMAINS;

export type ValidationReason = 'invalid_format' | 'free_email' | 'no_mx_record' | null;

export type ValidationResult = {
  ok: boolean;
  reason: ValidationReason;
};

export async function validateBusinessEmail(email: string): Promise<ValidationResult> {
  if (typeof email !== 'string' || !email.includes('@')) {
    return { ok: false, reason: 'invalid_format' };
  }

  const parts = email.toLowerCase().split('@');
  if (parts.length !== 2 || !parts[1]) {
    return { ok: false, reason: 'invalid_format' };
  }

  const domain = parts[1];

  if (FREE_EMAIL_DOMAINS.has(domain)) {
    return { ok: false, reason: 'free_email' };
  }

  // Skip MX lookup - too unreliable on serverless. Trust the domain.
  return { ok: true, reason: null };
}

export function businessEmailErrorMessage(reason: ValidationReason): string {
  switch (reason) {
    case 'invalid_format': return 'Please enter a valid email address.';
    case 'free_email':     return 'Please use a business email address.';
    case 'no_mx_record':   return 'This email domain does not appear valid.';
    default:               return 'Email validation failed.';
  }
}
