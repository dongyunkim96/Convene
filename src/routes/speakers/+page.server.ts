import { database, all } from '#lib/server/db.ts';
import type { Speaker } from '#lib/types.ts';
import { sessions } from '#lib/server/domain.ts';
export const load = async () => ({
  speakers: await all<Speaker>(database(), 'SELECT * FROM speakers'),
  sessions: await sessions(database()),
});
