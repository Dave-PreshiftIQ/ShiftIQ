import { db } from '../db';
import { scoringKeysFor } from './personas';

type Dim = 'D1'|'D2'|'D3'|'D4'|'D5'|'D6'|'D7'|'D8'|'D9';
const DIMS: Dim[] = ['D1','D2','D3','D4','D5','D6','D7','D8','D9'];
const emptyDims = (): Record<Dim, number> => ({ D1:0, D2:0, D3:0, D4:0, D5:0, D6:0, D7:0, D8:0, D9:0 });

type VendorRow = {
  id: string;
  user_id: string;
  audit_answers: any;
  match_criteria: any;
  status: string;
};

type SessionRow = {
  id: string;
  persona_tags: string[];
  answers: any;
};

export async function runMatching(sessionId: string) {
  const sess = await loadSession(sessionId);
  const vendors = await loadActiveVendors();
  const scoringConfig = await loadScoringConfig();

  const results = [];
  for (const v of vendors) {
    const phase1 = phase1HardFilter(sess, v);
    if (!phase1.pass) {
      await persistMatch(sess.id, v.id, false, phase1.breakdown, 0, 'not_recommended');
      continue;
    }

    const { raw, boosted, breakdown } = phase2And3Score(sess, v, scoringConfig);
    const tier = scoreToTier(boosted);
    await persistMatch(sess.id, v.id, true, breakdown, boosted, tier, raw);

    results.push({ vendor_id: v.id, total: boosted, tier });
  }

  const qualified = results
    .filter(r => r.tier !== 'not_recommended')
    .sort((a, b) => b.total - a.total);

  const shortlist = qualified.slice(0, 5);

  if (shortlist.length < 2) {
    await db.query(
      `INSERT INTO notifications (recipient_id, type, payload)
       SELECT id, 'match_created', jsonb_build_object(
         'session_id', $1, 'status', 'held', 'qualifying_count', $2::int,
         'reason', 'Fewer than 2 qualifying vendors - manual review required')
       FROM users WHERE role = 'admin'`,
      [sess.id, shortlist.length],
    );

    await db.query(
    await db.query(
      `UPDATE client_sessions SET match_score = $1::numeric WHERE id = $2`,
      [shortlist[0]?.total ?? null, sess.id],
    );

    await db.query(
      `UPDATE client_sessions SET answers = jsonb_set(answers, '{_meta,match_hold}', 'true'::jsonb, true) WHERE id = $1`,
      [sess.id],
    );

    return [];
  }

  for (const m of shortlist) {
    await db.query(
      `UPDATE match_results SET vendor_notified_at = NOW()
       WHERE client_session_id = $1 AND vendor_id = $2`,
      [sess.id, m.vendor_id],
    );
  }

  await db.query(
    `INSERT INTO notifications (recipient_id, type, payload)
     SELECT id, 'match_created', jsonb_build_object('session_id', $1, 'status', 'released', 'count', $2::int)
     FROM users WHERE role = 'admin'`,
    [sess.id, shortlist.length],
  );

  return shortlist;
}

export async function testMatch(sessionId: string) {
  const sess = await loadSession(sessionId);
  const vendors = await loadActiveVendors();
  const scoringConfig = await loadScoringConfig();

  const results = [];
  for (const v of vendors) {
    const phase1 = phase1HardFilter(sess, v);
    if (!phase1.pass) {
      results.push({ vendor_id: v.id, phase1_pass: false, total: 0, tier: 'not_recommended', breakdown: phase1.breakdown });
      continue;
    }
    const { raw, boosted, breakdown } = phase2And3Score(sess, v, scoringConfig);
    const tier = scoreToTier(boosted);
    results.push({ vendor_id: v.id, phase1_pass: true, total: boosted, raw, tier, breakdown });
  }

  results.sort((a, b) => b.total - a.total);
  const qualified = results.filter(r => r.phase1_pass && r.tier !== 'not_recommended');
  return {
    all_results: results,
    qualified_count: qualified.length,
    would_shortlist: qualified.slice(0, 5),
    would_hold: qualified.length < 2,
  };
}

export function phase1HardFilter(sess: SessionRow, v: VendorRow) {
  const breakdown: any = { checks: {} };

  const clientNonNeg: Record<string, boolean> = sess.answers?.non_negotiables ?? {};
  const vendorCaps:   Record<string, boolean> = v.match_criteria?.capabilities ?? {};
  for (const [k, required] of Object.entries(clientNonNeg)) {
    if (required && !vendorCaps[k]) {
      breakdown.checks.non_negotiables = { pass: false, missing: k };
      return { pass: false, breakdown };
    }
  }
  breakdown.checks.non_negotiables = { pass: true };

  const clientModes: string[] = Array.isArray(sess.answers?.modes_required) ? sess.answers.modes_required : [];
  const vendorModes: string[] = Array.isArray(v.match_criteria?.modes) ? v.match_criteria.modes : [];
  const modesOk = clientModes.every(m => vendorModes.includes(m));
  breakdown.checks.modal_fit = { pass: modesOk, required: clientModes, supported: vendorModes };
  if (!modesOk) return { pass: false, breakdown };

  const clientErps: string[] = Array.isArray(sess.answers?.erp) ? sess.answers.erp : [];
  const vendorErps: string[] = Array.isArray(v.match_criteria?.erp_compat) ? v.match_criteria.erp_compat : [];
  const erpOk = clientErps.length === 0 || clientErps.some(e => vendorErps.includes(e));
  breakdown.checks.erp_compat = { pass: erpOk, required: clientErps, supported: vendorErps };
  if (!erpOk) return { pass: false, breakdown };

  return { pass: true, breakdown };
}

export function phase2And3Score(
  sess: SessionRow,
  v: VendorRow,
  config: { weights: Record<Dim, number>; boosts: Record<Dim, Record<string, number>> },
) {
  const dimScores: Record<Dim, number> = v.match_criteria?.dimension_scores ?? emptyDims();
  const clientWeights: Partial<Record<Dim, number>> = sess.answers?.client_weights ?? {};

  let raw = 0;
  const breakdown: any = { dimensions: {} };

  for (const dim of DIMS) {
    const baseWeight = config.weights[dim] ?? 0;
    const clientPref = clientWeights[dim] ?? 1.0;
    const weighted = dimScores[dim] * (baseWeight / 100);
    const withClient = dim === 'D9' ? weighted : weighted * clientPref;
    breakdown.dimensions[dim] = { score: dimScores[dim], weight: baseWeight, client_pref: clientPref, contribution: withClient };
    raw += withClient;
  }

  const keys = scoringKeysFor(sess.persona_tags);
  const appliedBoosts: Record<Dim, number> = { D1:1, D2:1, D3:1, D4:1, D5:1, D6:1, D7:1, D8:1, D9:1 };
  for (const dim of DIMS) {
    const perDim = config.boosts[dim] ?? {};
    let maxBoost = 1.0;
    for (const k of keys) if ((perDim[k] ?? 1.0) > maxBoost) maxBoost = perDim[k];
    appliedBoosts[dim] = maxBoost;
  }

  let boosted = 0;
  for (const dim of DIMS) {
    const base = breakdown.dimensions[dim].contribution;
    const after = base * appliedBoosts[dim];
    breakdown.dimensions[dim].boost = appliedBoosts[dim];
    breakdown.dimensions[dim].final = after;
    boosted += after;
  }

  boosted = Math.min(100, boosted);
  raw = Math.min(100, raw);

  breakdown.raw = raw;
  breakdown.boosted = boosted;
  breakdown.persona_keys = keys;

  return { raw, boosted, breakdown };
}

export function scoreToTier(score: number): 'strong'|'good'|'conditional'|'not_recommended' {
  if (score >= 85) return 'strong';
  if (score >= 70) return 'good';
  if (score >= 55) return 'conditional';
  return 'not_recommended';
}

export async function loadSession(id: string): Promise<SessionRow> {
  const { rows } = await db.query(
    `SELECT id, persona_tags, answers FROM client_sessions WHERE id = $1`, [id],
  );
  if (rows.length === 0) throw new Error('Session not found');
  return rows[0];
}

export async function loadActiveVendors(): Promise<VendorRow[]> {
  const { rows } = await db.query(
    `SELECT id, user_id, audit_answers, match_criteria, status FROM vendor_records WHERE status = 'active'`,
  );
  return rows;
}

export async function loadScoringConfig() {
  const { rows } = await db.query(`SELECT dimension, weight, persona_boosts FROM scoring_config`);
  const weights: Record<Dim, number> = emptyDims();
  const boosts:  Record<Dim, Record<string, number>> = { D1:{},D2:{},D3:{},D4:{},D5:{},D6:{},D7:{},D8:{},D9:{} };
  for (const r of rows) {
    weights[r.dimension as Dim] = Number(r.weight);
    boosts[r.dimension as Dim]  = r.persona_boosts ?? {};
  }
  return { weights, boosts };
}

async function persistMatch(
  sessionId: string, vendorId: string, phase1Pass: boolean,
  breakdown: any, total: number, tier: string, raw?: number,
) {
  await db.query(
    `INSERT INTO match_results (client_session_id, vendor_id, phase1_pass, score, total_score, tier)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (client_session_id, vendor_id)
     DO UPDATE SET phase1_pass = EXCLUDED.phase1_pass, score = EXCLUDED.score,
                   total_score = EXCLUDED.total_score, tier = EXCLUDED.tier`,
    [sessionId, vendorId, phase1Pass, { ...breakdown, raw }, total.toFixed(2), tier],
  );
}
