import { db } from '../db';

export type ReleaseState =
  | 'not_matched'
  | 'matched_masked'
  | 'vendor_declined'
  | 'vendor_accepted'
  | 'admin_override';

export type ReleaseDecision = {
  state: ReleaseState;
  can_vendor_see_client_identity: boolean;
  can_client_see_vendor_identity: boolean;
  reason: string;
};

export async function decideRelease(matchId: string): Promise<ReleaseDecision> {
  const { rows } = await db.query(
    `SELECT m.id, m.phase1_pass, m.tier, m.vendor_accepted, m.vendor_declined,
            m.stripe_charge_id, m.vendor_notified_at,
            cs.status AS session_status
     FROM match_results m
     JOIN client_sessions cs ON cs.id = m.client_session_id
     WHERE m.id = $1`,
    [matchId],
  );

  if (rows.length === 0) {
    return { state: 'not_matched', can_vendor_see_client_identity: false, can_client_see_vendor_identity: false, reason: 'Match does not exist' };
  }

  const m = rows[0];

  if (!m.phase1_pass || m.tier === 'not_recommended') {
    return { state: 'not_matched', can_vendor_see_client_identity: false, can_client_see_vendor_identity: false, reason: 'Phase 1 filter failed or tier below threshold' };
  }

  if (!['submitted','matched','closed'].includes(m.session_status)) {
    return { state: 'not_matched', can_vendor_see_client_identity: false, can_client_see_vendor_identity: false, reason: 'Client session not submitted' };
  }

  if (m.vendor_declined) {
    return { state: 'vendor_declined', can_vendor_see_client_identity: false, can_client_see_vendor_identity: false, reason: 'Vendor declined the lead' };
  }

  if (m.vendor_accepted) {
    if (!m.stripe_charge_id) {
      return { state: 'matched_masked', can_vendor_see_client_identity: false, can_client_see_vendor_identity: false, reason: 'Accepted without recorded payment - denied' };
    }
    return { state: 'vendor_accepted', can_vendor_see_client_identity: true, can_client_see_vendor_identity: true, reason: 'Vendor accepted and lead fee paid' };
  }

  if (m.vendor_notified_at) {
    return { state: 'matched_masked', can_vendor_see_client_identity: false, can_client_see_vendor_identity: false, reason: 'Matched; awaiting vendor decision' };
  }

  return { state: 'not_matched', can_vendor_see_client_identity: false, can_client_see_vendor_identity: false, reason: 'Match not yet notified' };
}

export type ClientContact = { name: string; email: string; phone: string; company: string; };
export type VendorContact = { name: string; email: string; phone: string; company: string; };

export async function fetchClientContactIfAllowed(
  matchId: string,
  requestingVendorUserId: string,
): Promise<ClientContact | null> {
  const decision = await decideRelease(matchId);
  if (!decision.can_vendor_see_client_identity) {
    await logDenial(matchId, requestingVendorUserId, 'client_identity', decision.reason);
    return null;
  }

  const ownership = await db.query(
    `SELECT 1 FROM match_results m
     JOIN vendor_records v ON v.id = m.vendor_id
     WHERE m.id = $1 AND v.user_id = $2`,
    [matchId, requestingVendorUserId],
  );
  if (ownership.rows.length === 0) {
    await logDenial(matchId, requestingVendorUserId, 'client_identity', 'Vendor does not own this match');
    return null;
  }

  const { rows } = await db.query(
    `SELECT u.name, u.email, u.phone, u.company
     FROM match_results m
     JOIN client_sessions cs ON cs.id = m.client_session_id
     JOIN users u ON u.id = cs.user_id
     WHERE m.id = $1`,
    [matchId],
  );
  return rows[0] ?? null;
}

export async function fetchVendorContactIfAllowed(
  matchId: string,
  requestingClientUserId: string,
): Promise<VendorContact | null> {
  const decision = await decideRelease(matchId);
  if (!decision.can_client_see_vendor_identity) {
    await logDenial(matchId, requestingClientUserId, 'vendor_identity', decision.reason);
    return null;
  }

  const ownership = await db.query(
    `SELECT 1 FROM match_results m
     JOIN client_sessions cs ON cs.id = m.client_session_id
     WHERE m.id = $1 AND cs.user_id = $2`,
    [matchId, requestingClientUserId],
  );
  if (ownership.rows.length === 0) {
    await logDenial(matchId, requestingClientUserId, 'vendor_identity', 'Client does not own this match');
    return null;
  }

  const { rows } = await db.query(
    `SELECT u.name, u.email, u.phone, u.company
     FROM match_results m
     JOIN vendor_records v ON v.id = m.vendor_id
     JOIN users u ON u.id = v.user_id
     WHERE m.id = $1`,
    [matchId],
  );
  return rows[0] ?? null;
}

async function logDenial(matchId: string, actorId: string, resource: string, reason: string) {
  await db.query(
    `INSERT INTO audit_log (user_id, action, entity_type, entity_id, before, after)
     VALUES ($1, 'data_release_denied', 'match_result', $2, NULL, $3)`,
    [actorId, matchId, { resource, reason }],
  );
}
