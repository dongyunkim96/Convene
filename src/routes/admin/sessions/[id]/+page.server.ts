import type { RequestEvent } from '@sveltejs/kit';
import { error, fail } from '@sveltejs/kit';
import { requireOrganizer } from '#lib/server/guards.ts';
import { database, all } from '#lib/server/db.ts';
import { session, setCapacity, DomainError } from '#lib/server/domain.ts';
export const load = async ({ locals, params }: RequestEvent) => {
  requireOrganizer(locals);
  const db = database();
  const s = await session(db, Number(params.id));
  if (!s) error(404, 'Session not found.');
  return {
    session: s,
    records: await all<{
      id: string;
      name: string;
      email: string;
      kind: string;
      position: number | null;
    }>(
      db,
      `SELECT u.id,u.name,u.email,'Confirmed' kind,NULL position FROM users u JOIN reservations r ON r.user_id=u.id WHERE r.session_id=? UNION ALL SELECT u.id,u.name,u.email,'Waitlisted' kind,w.id position FROM users u JOIN waitlist w ON w.user_id=u.id WHERE w.session_id=? ORDER BY kind,position`,
      s.id,
      s.id,
    ),
  };
};
export const actions = {
  default: async ({ locals, params, request }: RequestEvent) => {
    const user = requireOrganizer(locals);
    const value = Number((await request.formData()).get('capacity'));
    try {
      return await setCapacity(database(), user, Number(params.id), value);
    } catch (e) {
      if (e instanceof DomainError) return fail(400, { message: e.message });
      throw e;
    }
  },
};
