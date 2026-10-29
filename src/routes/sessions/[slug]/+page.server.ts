import type { RequestEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { database } from '#lib/server/db.ts';
import { sessions, conflict } from '#lib/server/domain.ts';
export const load = async ({ params, locals }: RequestEvent) => {
  const db = database();
  const s = (await sessions(db, locals.user?.id)).find((s) => s.slug === params.slug);
  if (!s) error(404, 'This session could not be found.');
  return { session: s, conflict: locals.user ? await conflict(db, locals.user.id, s) : undefined };
};
