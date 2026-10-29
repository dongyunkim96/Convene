import type { RequestEvent } from '@sveltejs/kit';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { database, one } from '#lib/server/db.ts';
import { createAuth, passwordMatches } from '#lib/server/auth.ts';
export const actions = {
  default: async ({ request, cookies, url }: RequestEvent) => {
    const p = z
      .object({ email: z.email().max(254), password: z.string().min(1).max(128) })
      .safeParse(Object.fromEntries(await request.formData()));
    if (!p.success) return fail(400, { message: 'Enter your email and password.' });
    const user = await one<{
      id: string;
      password: string;
      role: string;
    }>(database(), 'SELECT id,password,role FROM users WHERE lower(email)=lower(?)', p.data.email);
    if (!user || !passwordMatches(p.data.password, user.password))
      return fail(400, { message: 'Email or password is incorrect. Please try again.' });
    await createAuth(cookies, user.id, url.protocol === 'https:');
    redirect(303, user.role === 'organizer' ? '/admin' : '/my-schedule');
  },
};
