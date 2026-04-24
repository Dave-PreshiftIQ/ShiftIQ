import 'dotenv/config';
import { getBoss, QUEUE_MATCHING } from '../lib/jobs';
import { runMatching } from '../lib/matching';
import { drainNotificationsToEmail } from '../lib/notifications';
import { db } from '../db';

(async () => {
  const boss = await getBoss();

  await boss.work(QUEUE_MATCHING, { batchSize: 2 }, async ([job]) => {
    const { session_id } = job.data as { session_id: string };
    try {
      const matches = await runMatching(session_id);
      await db.query(`UPDATE client_sessions SET status = 'matched' WHERE id = $1`, [session_id]);
      await db.query(
        `INSERT INTO notifications (recipient_id, type, payload)
         SELECT id, 'client_submitted', jsonb_build_object('session_id', $1, 'match_count', $2::int)
         FROM users WHERE role = 'admin'`,
        [session_id, matches.length],
      );
    } catch (err) {
      await db.query(`UPDATE client_sessions SET status = 'submitted' WHERE id = $1`, [session_id]);
      throw err;
    }
  });

  await boss.schedule('notifications.drain', '* * * * *');
  await boss.work('notifications.drain', async () => { await drainNotificationsToEmail(); });

  console.log('Workers online: matching + notifications.drain');
})();
