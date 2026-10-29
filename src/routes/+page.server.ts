import type { RequestEvent } from '@sveltejs/kit';
import { database, all } from '#lib/server/db.ts';
import { sessions } from '#lib/server/domain.ts';
import type { Speaker } from '#lib/types.ts';
export const load = ({ locals }: RequestEvent) => {
  const db = database();
  const list = sessions(db, locals.user?.id);
  return {
    featured: [
      list.find((s) => s.id === 1)!,
      list.find((s) => s.id === 2)!,
      list.find((s) => s.id === 3)!,
    ],
    speakers: all<Speaker>(db, 'SELECT * FROM speakers LIMIT 4'),
    reserved: list.filter((s) => s.state === 'reserved'),
  };
};
