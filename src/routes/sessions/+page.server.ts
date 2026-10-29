import type { RequestEvent } from '@sveltejs/kit';
import { database, all } from '#lib/server/db.ts';
import { sessions } from '#lib/server/domain.ts';
import type { Speaker } from '#lib/types.ts';
export const load = async ({ locals }: RequestEvent) => ({
  sessions: await sessions(database(), locals.user?.id),
  speakers: await all<Speaker>(database(), 'SELECT * FROM speakers'),
});
