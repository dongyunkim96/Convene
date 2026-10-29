import type { RequestEvent } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { requireUser } from '#lib/server/guards.ts';
import { database } from '#lib/server/db.ts';
export const load = ({ locals }: RequestEvent) => {
  requireUser(locals);
};
export const actions = {
  default: async ({ request, locals }: RequestEvent) => {
    const user = requireUser(locals);
    const p = z
      .object({
        company: z.string().trim().max(120),
        title: z.string().trim().max(120),
        interests: z.string().max(300),
        preferences: z.string().trim().max(1000),
      })
      .safeParse(Object.fromEntries(await request.formData()));
    if (!p.success)
      return fail(400, {
        message:
          'Please keep company and title below 120 characters and preferences below 1,000 characters.',
      });
    await database()
      .prepare('UPDATE profiles SET company=?,title=?,interests=?,preferences=? WHERE user_id=?')
      .run(p.data.company, p.data.title, p.data.interests, p.data.preferences, user.id);
    return { message: 'Your profile has been updated.' };
  },
};
