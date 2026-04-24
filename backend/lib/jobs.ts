import PgBoss from 'pg-boss';

let boss: PgBoss | null = null;

export async function getBoss(): Promise<PgBoss> {
  if (boss) return boss;
  boss = new PgBoss({
    connectionString: process.env.DATABASE_URL!,
    schema: 'pgboss',
    retryLimit: 3,
    retryBackoff: true,
  });
  await boss.start();
  await boss.createQueue(QUEUE_MATCHING);
  return boss;
}

export const QUEUE_MATCHING = 'matching.run';
