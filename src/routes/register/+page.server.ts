import type { RequestEvent } from '@sveltejs/kit';
import { fail, redirect } from '@sveltejs/kit';
import { registrationSchema } from '#lib/validation.ts';
import { database, one } from '#lib/server/db.ts';
import { addUser, createAuth, hash } from '#lib/server/auth.ts';
export const actions = {
  default: async ({ request, cookies, url }: RequestEvent) => {
    const fields = Object.fromEntries(await request.formData());
    const parsed = registrationSchema.safeParse(fields);
    if (!parsed.success)
      return fail(400, {
        errors: parsed.error.issues.map((e) => ({ field: String(e.path[0]), message: e.message })),
      });
    const v = parsed.data;
    const db = database();
    if (
      v.category !== 'general' &&
      !(await one(
        db,
        'SELECT category FROM invitations WHERE code_hash=? AND category=?',
        hash(v.code),
        v.category,
      ))
    )
      return fail(400, {
        errors: [
          { field: 'code', message: 'Enter a valid invitation code for this attendee category.' },
        ],
      });
    if (await one(db, 'SELECT id FROM users WHERE lower(email)=lower(?)', v.email))
      return fail(400, {
        errors: [
          {
            field: 'email',
            message: 'An account with this email already exists. Sign in to continue.',
          },
        ],
      });
    let id: string;
    try {
      id = await addUser(db, { ...v, name: v.first + ' ' + v.last });
    } catch {
      return fail(409, {
        errors: [
          {
            field: 'email',
            message: 'Registration could not be completed. Try another email or sign in.',
          },
        ],
      });
    }
    await createAuth(cookies, id, url.protocol === 'https:');
    redirect(303, '/my-schedule?welcome=1');
  },
};
