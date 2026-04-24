import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import {
  decideRelease,
  fetchClientContactIfAllowed,
  fetchVendorContactIfAllowed,
} from '../lib/data-release-policy';

async function mkUser(role: 'client'|'vendor'|'admin', email: string) {
  const { rows } = await db.query(
    `INSERT INTO users (clerk_user_id, name, email, phone, company, role, email_verified, email_domain)
     VALUES ($1, $2, $3, '555', 'Acme', $4, TRUE, $5) RETURNING id`,
    [`clerk_${email}`, email.split('@')[0], email, role, email.split('@')[1]],
  );
  return rows[0].id;
}

async function mkSession(userId: string, status = 'submitted') {
  const { rows } = await db.query(
    `INSERT INTO client_sessions (user_id, persona_tags, answers, tier1_completion, status, submitted_at)
     VALUES ($1, ARRAY['shipper'], '{}'::jsonb, 100, $2, NOW()) RETURNING id`,
    [userId, status],
  );
  return rows[0].id;
}

async function mkVendor(userId: string, status = 'active') {
  const { rows } = await db.query(
    `INSERT INTO vendor_records (user_id, status, match_criteria) VALUES ($1, $2, '{}'::jsonb) RETURNING id`,
    [userId, status],
  );
  return rows[0].id;
}

async function mkMatch(sessionId: string, vendorId: string, opts: any = {}) {
  const { rows } = await db.query(
    `INSERT INTO match_results
      (client_session_id, vendor_id, phase1_pass, score, total_score, tier,
       vendor_notified_at, vendor_accepted, vendor_declined, stripe_charge_id)
     VALUES ($1, $2, $3, '{}'::jsonb, 80, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      sessionId, vendorId,
      opts.phase1_pass ?? true,
      opts.tier ?? 'good',
      opts.notified ? new Date() : null,
      opts.accepted ?? false,
      opts.declined ?? false,
      opts.charge ?? null,
    ],
  );
  return rows[0].id;
}

describe('data-release-policy', () => {
  let clientUserId: string, vendorUserId: string, otherVendorUserId: string;
  let sessionId: string, vendorId: string;

  beforeEach(async () => {
    await db.query(`TRUNCATE match_results, client_sessions, vendor_records, users, audit_log CASCADE`);
    clientUserId = await mkUser('client', 'c@co.com');
    vendorUserId = await mkUser('vendor', 'v@vc.com');
    otherVendorUserId = await mkUser('vendor', 'v2@vc.com');
    sessionId = await mkSession(clientUserId);
    vendorId = await mkVendor(vendorUserId);
  });

  it('no release when match does not exist', async () => {
    const d = await decideRelease('00000000-0000-0000-0000-000000000000');
    expect(d.state).toBe('not_matched');
  });

  it('no release when phase1 fails', async () => {
    const mid = await mkMatch(sessionId, vendorId, { phase1_pass: false, notified: true });
    const d = await decideRelease(mid);
    expect(d.state).toBe('not_matched');
  });

  it('matched_masked when notified but not accepted', async () => {
    const mid = await mkMatch(sessionId, vendorId, { notified: true });
    const d = await decideRelease(mid);
    expect(d.state).toBe('matched_masked');
    expect(d.can_vendor_see_client_identity).toBe(false);
  });

  it('declined => no release', async () => {
    const mid = await mkMatch(sessionId, vendorId, { notified: true, declined: true });
    const d = await decideRelease(mid);
    expect(d.state).toBe('vendor_declined');
  });

  it('accepted WITHOUT charge => denied', async () => {
    const mid = await mkMatch(sessionId, vendorId, { notified: true, accepted: true, charge: null });
    const d = await decideRelease(mid);
    expect(d.can_vendor_see_client_identity).toBe(false);
  });

  it('accepted WITH charge => mutual release', async () => {
    const mid = await mkMatch(sessionId, vendorId, { notified: true, accepted: true, charge: 'pi_123' });
    const d = await decideRelease(mid);
    expect(d.state).toBe('vendor_accepted');
    expect(d.can_vendor_see_client_identity).toBe(true);
    expect(d.can_client_see_vendor_identity).toBe(true);
  });

  it('other vendor cannot fetch client contact', async () => {
    const mid = await mkMatch(sessionId, vendorId, { notified: true, accepted: true, charge: 'pi_123' });
    const contact = await fetchClientContactIfAllowed(mid, otherVendorUserId);
    expect(contact).toBeNull();
  });
});
