import type { Handle } from '@sveltejs/kit/hooks';
import { currentUser } from '#lib/server/auth.ts';
export const handle: Handle = async ({ event, resolve }) => {
  // Framework form protections plus explicit protection for JSON mutation endpoints.
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(event.request.method) &&
    event.request.headers.get('origin') !== event.url.origin
  )
    return new Response('Cross-origin request rejected', { status: 403 });
  event.locals.user = await currentUser(event.cookies.get('convene_session'));
  const response = await resolve(event);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'same-origin');
  if (
    event.locals.user ||
    event.url.pathname.startsWith('/admin') ||
    event.url.pathname.startsWith('/api')
  )
    response.headers.set('Cache-Control', 'private, no-store');
  return response;
};
