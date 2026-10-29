import type { RequestEvent } from '@sveltejs/kit';
import { requireOrganizer } from '#lib/server/guards.ts';
import { database, all } from '#lib/server/db.ts';
import { csvCell } from '#lib/server/domain.ts';
export const GET = ({ locals }: RequestEvent) => {
  requireOrganizer(locals);
  const records = all<Record<string, unknown>>(
    database(),
    `SELECT u.name,u.email,p.category,p.reference,COALESCE(c.checked_at,'Not checked in') checkin,(SELECT COUNT(*) FROM reservations WHERE user_id=u.id) reservations,(SELECT COUNT(*) FROM waitlist WHERE user_id=u.id) waitlists FROM users u JOIN profiles p ON p.user_id=u.id LEFT JOIN checkins c ON c.user_id=u.id WHERE u.role='attendee'`,
  );
  const rows = [
    ['Name', 'Email', 'Category', 'Reference', 'Event check-in', 'Reservations', 'Waitlists'],
    ...records.map((r) => Object.values(r)),
  ];
  return new Response('\uFEFF' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="convene-attendees.csv"',
      'Cache-Control': 'private, no-store',
    },
  });
};
