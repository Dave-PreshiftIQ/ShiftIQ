import { Router } from 'express';
import { db } from '../../db';

const r = Router();

r.get('/session/:id', async (req, res) => {
  const sessionId = req.params.id;

  const session = await db.query(
    `SELECT id, persona_tags, answers, tier1_completion, tier2_unlocked, status FROM client_sessions WHERE id = $1`,
    [sessionId],
  );
  if (session.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  const s = session.rows[0];

  const questions = await db.query(
    `SELECT id, section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension
     FROM questions
     WHERE active = TRUE AND audience = 'client'
       AND (cardinality(persona_tags) = 0 OR persona_tags && $1::text[])
     ORDER BY tier, section, order_index`,
    [s.persona_tags],
  );

  res.json({
    session: {
      id: s.id,
      persona_tags: s.persona_tags,
      answers: s.answers,
      tier1_completion: Number(s.tier1_completion),
      tier2_unlocked: s.tier2_unlocked,
      status: s.status,
    },
    questions: questions.rows,
  });
});

r.post('/session/:id/answer', async (req, res) => {
  const sessionId = req.params.id;
  const { question_id, value } = req.body ?? {};
  if (!question_id) return res.status(400).json({ error: 'question_id required' });

  const { rows } = await db.query(
    `UPDATE client_sessions
     SET answers = jsonb_set(answers, ARRAY[$2::text], to_jsonb($3::jsonb), true),
         status = 'in_progress'
     WHERE id = $1
     RETURNING answers, persona_tags`,
    [sessionId, question_id, JSON.stringify(value)],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

  const completion = await recomputeTier1Completion(sessionId, rows[0].persona_tags);
  res.json({ ok: true, tier1_completion: completion.pct, tier2_unlocked: completion.unlocked });
});

r.post('/session/:id/submit', async (req, res) => {
  const sessionId = req.params.id;

  const { rows } = await db.query(
    `SELECT persona_tags, tier1_completion, status FROM client_sessions WHERE id = $1`,
    [sessionId],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
  if (Number(rows[0].tier1_completion) < 100) {
    return res.status(400).json({ error: 'All required Tier 1 questions must be answered.' });
  }
  if (rows[0].status === 'matched') return res.json({ status: 'matched' });

  await db.query(
    `UPDATE client_sessions SET status = 'submitted', submitted_at = NOW() WHERE id = $1`,
    [sessionId],
  );

  const { getBoss, QUEUE_MATCHING } = await import('../../lib/jobs');
  const boss = await getBoss();
  await boss.send(QUEUE_MATCHING, { session_id: sessionId });

  res.json({ status: 'matching' });
});

r.get('/session/:id/status', async (req, res) => {
  const { rows } = await db.query(
    `SELECT status FROM client_sessions WHERE id = $1`, [req.params.id],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ status: rows[0].status });
});

r.post('/answer-change', async (req, res) => {
  const userRow = await db.query(`SELECT id FROM users WHERE clerk_user_id = $1`, [(req as any).auth.userId]);
  const { session_id, section, new_answers, reason } = req.body ?? {};

  const old = await db.query(
    `SELECT answers FROM client_sessions WHERE id = $1 AND user_id = $2`,
    [session_id, userRow.rows[0].id],
  );
  if (old.rows.length === 0) return res.status(404).json({ error: 'Session not found' });

  await db.query(
    `INSERT INTO answer_change_requests (user_id, session_type, session_id, section, old_answers, new_answers, reason)
     VALUES ($1, 'client', $2, $3, $4, $5, $6)`,
    [userRow.rows[0].id, session_id, section, old.rows[0].answers, new_answers, reason],
  );

  await db.query(
    `INSERT INTO notifications (recipient_id, type, payload)
     SELECT id, 'client_answer_update', jsonb_build_object('session_id', $1)
     FROM users WHERE role = 'admin'`,
    [session_id],
  );

  res.json({ ok: true });
});

async function recomputeTier1Completion(sessionId: string, personaTags: string[]) {
  const totals = await db.query(
    `SELECT id FROM questions
     WHERE active = TRUE AND audience = 'client' AND tier = 1 AND required = TRUE
       AND (cardinality(persona_tags) = 0 OR persona_tags && $1::text[])`,
    [personaTags],
  );
  const totalIds: string[] = totals.rows.map(x => x.id);

  const session = await db.query(`SELECT answers FROM client_sessions WHERE id = $1`, [sessionId]);
  const answers = session.rows[0].answers ?? {};
  const answered = totalIds.filter(id => answers[id] !== undefined && answers[id] !== null && answers[id] !== '');

  const pct = totalIds.length === 0 ? 100 : (answered.length / totalIds.length) * 100;
  const unlocked = pct >= 80;

  await db.query(
    `UPDATE client_sessions SET tier1_completion = $1, tier2_unlocked = $2 WHERE id = $3`,
    [pct.toFixed(2), unlocked, sessionId],
  );

  return { pct, unlocked };
}

export default r;
