import type { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { database } from '#lib/server/db.ts';
import { book, cancel, DomainError } from '#lib/server/domain.ts';
export const POST = async ({ request, locals }: RequestEvent) => {
  if (!locals.user)
    return Response.json({ message: 'Sign in or register to reserve a seat.' }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: 'Invalid request.' }, { status: 400 });
  }
  const p = z
    .object({ id: z.number().int().positive(), action: z.enum(['book', 'cancel']) })
    .safeParse(body);
  if (!p.success)
    return Response.json({ message: 'Choose a valid session and action.' }, { status: 400 });
  try {
    return Response.json(
      p.data.action === 'book'
        ? book(database(), locals.user.id, p.data.id)
        : cancel(database(), locals.user.id, p.data.id),
    );
  } catch (e) {
    if (e instanceof DomainError)
      return Response.json({ message: e.message, conflictSlug: e.conflictSlug }, { status: 409 });
    throw e;
  }
};
