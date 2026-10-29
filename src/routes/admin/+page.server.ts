import type { RequestEvent } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { requireOrganizer } from '#lib/server/guards.ts';
import { database, all } from '#lib/server/db.ts';
import { sessions, checkin, DomainError } from '#lib/server/domain.ts';
import type { User } from '#lib/types.ts';
export const load = async ({ locals }: RequestEvent) => {
  requireOrganizer(locals);
  const db = database();
  return {
    sessions: await sessions(db),
    attendees: await all<
      User & {
        checked_at: string | null;
      }
    >(
      db,
      `SELECT u.id,u.name,u.email,p.category,p.reference,c.checked_at FROM users u JOIN profiles p ON p.user_id=u.id LEFT JOIN checkins c ON c.user_id=u.id WHERE u.role='attendee' ORDER BY u.name`,
    ),
    reservations: await all<{
      user_id: string;
      title: string;
      start: string;
      end: string;
    }>(
      db,
      'SELECT r.user_id,s.title,s.start,s."end" FROM reservations r JOIN sessions s ON s.id=r.session_id',
    ),
    transitions: await all<{
      id: number;
      name: string;
      title: string;
      kind: string;
      created: string;
    }>(
      db,
      'SELECT t.*,u.name,s.title FROM transitions t JOIN users u ON u.id=t.user_id JOIN sessions s ON s.id=t.session_id ORDER BY t.id DESC LIMIT 15',
    ),
  };
};
export const actions = {
  verify: async ({ locals, request }: RequestEvent) => {
    const organizer = requireOrganizer(locals);
    const p = z
      .string()
      .regex(/^[a-f0-9]{64}$/, 'Enter the 64-character pass token.')
      .safeParse((await request.formData()).get('token'));
    if (!p.success)
      return fail(400, {
        message: 'Invalid pass. Enter the 64-character pass token.',
        name: '',
        reference: '',
      });
    try {
      return await checkin(database(), organizer, p.data);
    } catch (e) {
      if (e instanceof DomainError)
        return fail(400, { message: e.message, name: '', reference: '' });
      throw e;
    }
  },
};
