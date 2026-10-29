import type { RequestEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { database } from '#lib/server/db.ts';
import { hash } from '#lib/server/auth.ts';
export const POST = ({ cookies }: RequestEvent) => {
  const token = cookies.get('convene_session');
  if (token) database().prepare('DELETE FROM auth_sessions WHERE hash=?').run(hash(token));
  cookies.delete('convene_session', { path: '/' });
  redirect(303, '/');
};
