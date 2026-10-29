import type { RequestEvent } from '@sveltejs/kit';
import { database, all } from '#lib/server/db.ts';
import { sessions } from '#lib/server/domain.ts';
import { requireUser } from '#lib/server/guards.ts';
export const load = ({ locals }: RequestEvent) => {
  const user = requireUser(locals);
  return {
    sessions: sessions(database(), user.id).filter((s) => s.state),
    notifications: all<{ id: number; title: string; kind: string }>(
      database(),
      `SELECT t.id,s.title,t.kind FROM transitions t JOIN sessions s ON s.id=t.session_id WHERE user_id=? AND kind='Promoted from waitlist' ORDER BY t.id DESC LIMIT 5`,
      user.id,
    ),
  };
};
