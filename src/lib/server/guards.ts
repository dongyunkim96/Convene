import { redirect, error } from '@sveltejs/kit';
export function requireUser(locals: App.Locals) {
  if (!locals.user) redirect(303, '/login');
  return locals.user;
}
export function requireOrganizer(locals: App.Locals) {
  const user = requireUser(locals);
  if (user.role !== 'organizer') error(403, 'Organizer access required.');
  return user;
}
