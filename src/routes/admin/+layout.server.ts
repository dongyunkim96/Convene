import type { RequestEvent } from '@sveltejs/kit';
import { requireOrganizer } from '#lib/server/guards.ts';
export const load = ({ locals }: RequestEvent) => {
  requireOrganizer(locals);
};
