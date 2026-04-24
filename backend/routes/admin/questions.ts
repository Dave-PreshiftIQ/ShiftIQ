import { Router } from 'express';
import { db } from '../../db';
import { PERSONAS } from '../../lib/personas';

const VALID_PERSONAS = new Set<string>(PERSONAS.map(p => p.id));
const VALID_DIMS = new Set<string>(['D1','D2','D3','D4','D5','D6','D7','D8','D9']);
const VALID_TYPES = new Set<string>(['single_select','multi_select','text','number','boolean','range','scale']);
const VALID_AUDIENCES = new Set<string>(['client','vendor']);

const r = Router();

r.get('/questions', async (req, res) => {
  const { audience, section, tier } = req.query;
  const clauses: string[] = [];
  const params: any[] = [];
  if (audience) { params.push(audience); clauses.push(`audience = $${params.length}`); }
  if (section)  { params.push(Number(section)); clauses.push(`section = $${params.length}`); }
  if (tier)     { params.push(Number(tier)); clauses.push(`tier = $${params.length}`); }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const { rows } = await db.query(
    `SELECT * FROM questions ${where} ORDER BY audience, section, tier, order_index`,
    params,
  );
  res.json({ questions: rows });
});

r.post('/questions', async (req, res) => {
  const adminRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  const q = normalize(req.body);
  if (!q) return res.status(400).json({ error: 'Invalid question payload' });

  const inserted = await db.query(
    `INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, active, weight, dimension, audience)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [q.section, q.tier, q.order_index, q.text, q.help_text, q.type, q.options, q.persona_tags, q.required, q.active, q.weight, q.dimension, q.audience],
  );

  await db.query(
    `INSERT INTO audit_log (user_id, action, entity_type, entity_id, before, after)
     VALUES ($1, 'question_create', 'question', $2, NULL, $3)`,
    [adminRow.rows[0].id, inserted.rows[0].id, inserted.rows[0]],
  );

  res.json({ question: inserted.rows[0] });
});

r.patch('/questions/:id', async (req, res) => {
  const adminRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  const before = await db.query(`SELECT * FROM questions WHERE id = $1`, [req.params.id]);
  if (before.rows.length === 0) return res.status(404).json({ error: 'Not found' });

  const q = normalize({ ...before.rows[0], ...req.body });
  if (!q) return res.status(400).json({ error: 'Invalid question payload' });

  const upd = await db.query(
    `UPDATE questions SET
      section=$1, tier=$2, order_index=$3, text=$4, help_text=$5, type=$6,
      options=$7, persona_tags=$8, required=$9, active=$10, weight=$11, dimension=$12, audience=$13
     WHERE id=$14 RETURNING *`,
    [q.section, q.tier, q.order_index, q.text, q.help_text, q.type, q.options, q.persona_tags, q.required, q.active, q.weight, q.dimension, q.audience, req.params.id],
  );

  await db.query(
    `INSERT INTO audit_log (user_id, action, entity_type, entity_id, before, after)
     VALUES ($1, 'question_update', 'question', $2, $3, $4)`,
    [adminRow.rows[0].id, req.params.id, before.rows[0], upd.rows[0]],
  );

  res.json({ question: upd.rows[0] });
});

r.delete('/questions/:id', async (req, res) => {
  const adminRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  const upd = await db.query(
    `UPDATE questions SET active = FALSE WHERE id = $1 RETURNING *`, [req.params.id],
  );
  if (upd.rows.length === 0) return res.status(404).json({ error: 'Not found' });

  await db.query(
    `INSERT INTO audit_log (user_id, action, entity_type, entity_id, before, after)
     VALUES ($1, 'question_deactivate', 'question', $2, NULL, $3)`,
    [adminRow.rows[0].id, req.params.id, upd.rows[0]],
  );
  res.json({ ok: true });
});

function normalize(raw: any): any | null {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.text !== 'string' || !raw.text.trim()) return null;
  if (!VALID_TYPES.has(raw.type)) return null;
  if (!VALID_AUDIENCES.has(raw.audience ?? 'client')) return null;

  const personaTags: string[] = Array.isArray(raw.persona_tags) ? raw.persona_tags.filter((p: string) => VALID_PERSONA_IDS.has(p)) : [];
  const dim = raw.dimension && VALID_DIMS.has(raw.dimension) ? raw.dimension : null;

  return {
    section: Number(raw.section) || 1,
    tier: Number(raw.tier) === 2 ? 2 : 1,
    order_index: Number(raw.order_index) || 0,
    text: raw.text.trim(),
    help_text: raw.help_text ?? null,
    type: raw.type,
    options: raw.options ?? null,
    persona_tags: personaTags,
    required: !!raw.required,
    active: raw.active === undefined ? true : !!raw.active,
    weight: Number(raw.weight) || 1.0,
    dimension: dim,
    audience: raw.audience ?? 'client',
  };
}

export default r;
